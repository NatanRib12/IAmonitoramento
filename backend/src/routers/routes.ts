import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { processarVideoIA } from '../Service';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

const prisma = new PrismaClient();

export async function routes(app: FastifyInstance) {

  // ROTA: Processamento de Vídeo por IA
  app.post('/api/videos/processar', async (request, reply) => {
    const data = await request.file();
    
    if (!data) {
      return reply.status(400).send({ erro: 'Nenhum vídeo enviado.' });
    }

    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${data.filename}`;
    const savePath = path.join(uploadsDir, fileName);

    try {
      await pipeline(data.file, fs.createWriteStream(savePath));

      const resultadoIA = await processarVideoIA(savePath);

      if (!resultadoIA.sucesso) {
        throw new Error(resultadoIA.erro);
      }

      return reply.send({
        sucesso: true,
        mensagem: 'Processamento e laudo concluídos!',
        totalCabecas: resultadoIA.total_gado,
        videoProcessadoUrl: `http://localhost:3333/uploads/${resultadoIA.video_processado}`
      });

    } catch (error: any) {
      console.error('Erro no processamento do vídeo:', error);
      return reply.status(500).send({ erro: error.message || 'Falha ao processar o vídeo.' });
    }
  });

  // ROTA: Salvar Vídeo nas Galerias (Isolado por Fazenda)
  app.post('/api/videos/salvar-galeria', async (request, reply) => {
    const { fazendaId, quantidadeCabecas, videoOriginalUrl, videoProcessadoUrl, status } = request.body as any;

    if (!fazendaId) {
      return reply.status(400).send({ erro: 'O ID da fazenda é obrigatório.' });
    }

    try {
      const novoLote = await prisma.lote.create({
        data: {
          quantidadeCabecas: Number(quantidadeCabecas) || 0,
          videoOriginalUrl: videoOriginalUrl || '',
          videoProcessadoUrl: videoProcessadoUrl || '',
          status: status || 'RASCUNHO', // 'RASCUNHO' para galerias, 'DISPONIVEL' para mercado
          fazendaId: fazendaId
        }
      });

      return reply.status(201).send({
        sucesso: true,
        mensagem: 'Vídeo salvo na galeria da fazenda com sucesso!',
        lote: novoLote
      });
    } catch (error) {
      console.error('Erro ao salvar vídeo na galeria:', error);
      return reply.status(500).send({ erro: 'Erro interno ao salvar vídeo.' });
    }
  });

  // ROTA: Buscar Vídeos da Galeria da Fazenda Ativa (Isolamento Total por Usuário)
  app.get('/api/videos/minha-fazenda', async (request, reply) => {
    const { fazendaId } = request.query as { fazendaId?: string };

    if (!fazendaId) {
      return reply.status(400).send({ erro: 'ID da fazenda é necessário.' });
    }

    try {
      const lotes = await prisma.lote.findMany({
        where: { fazendaId },
        orderBy: { createdAt: 'desc' }
      });

      return reply.send({
        sucesso: true,
        lotes
      });
    } catch (error) {
      console.error('Erro ao buscar vídeos da fazenda:', error);
      return reply.status(500).send({ erro: 'Falha ao buscar biblioteca de vídeos.' });
    }
  });

  // ROTA: Publicar Lote no Mercado / Notificar Parceiros
  app.post('/api/lotes/publicar', async (request, reply) => {
    const { loteId, quantidadeCabecas, videoProcessadoUrl, fazendaId } = request.body as any;

    try {
      if (loteId) {
        // Atualiza status de um lote/vídeo já existente na galeria
        const loteAtualizado = await prisma.lote.update({
          where: { id: loteId },
          data: {
            status: 'DISPONIVEL',
            quantidadeCabecas: quantidadeCabecas ? Number(quantidadeCabecas) : undefined
          }
        });

        return reply.send({
          sucesso: true,
          mensagem: 'Lote publicado com sucesso!',
          lote: loteAtualizado
        });
      }

      // Cria um novo lote direto se não existir registro anterior
      let targetFazendaId = fazendaId;
      if (!targetFazendaId) {
        const primeiraFazenda = await prisma.fazenda.findFirst();
        targetFazendaId = primeiraFazenda?.id;
      }

      if (!targetFazendaId) {
        return reply.status(400).send({ erro: 'Nenhuma fazenda vinculada encontrada.' });
      }

      const novoLote = await prisma.lote.create({
        data: {
          quantidadeCabecas: Number(quantidadeCabecas) || 0,
          videoOriginalUrl: videoProcessadoUrl || '',
          videoProcessadoUrl: videoProcessadoUrl || '',
          status: 'DISPONIVEL',
          fazendaId: targetFazendaId
        }
      });

      return reply.status(201).send({
        sucesso: true,
        mensagem: 'Lote disponibilizado para o mercado!',
        lote: novoLote
      });
    } catch (error) {
      console.error('Erro ao publicar lote:', error);
      return reply.status(500).send({ erro: 'Falha ao publicar lote no mercado.' });
    }
  });

  // ROTA: Registro de Usuário / Produtor
  app.post('/api/usuarios/registrar', async (request, reply) => {
    const { nome, email, idade, senha, nomeFazenda, localizacao } = request.body as any;

    if (!nome || !email || !idade || !senha || !nomeFazenda || !localizacao) {
      return reply.status(400).send({ erro: 'Todos os campos são obrigatórios.' });
    }

    try {
      const usuarioExistente = await prisma.usuario.findUnique({ where: { email } });
      if (usuarioExistente) {
        return reply.status(400).send({ erro: 'Este e-mail já está cadastrado.' });
      }

      const novoUsuario = await prisma.usuario.create({
        data: {
          nome,
          email,
          idade: Number(idade),
          senhaHash: senha,
          fazenda: {
            create: {
              nome: nomeFazenda,
              localizacao,
            },
          },
        },
        include: { fazenda: true },
      });

      return reply.status(201).send({
        sucesso: true,
        mensagem: 'Usuário e Fazenda cadastrados com sucesso!',
        usuarioId: novoUsuario.id,
        fazendaId: novoUsuario.fazenda?.id
      });
    } catch (error) {
      console.error('Erro no registro do usuário:', error);
      return reply.status(500).send({ erro: 'Erro interno ao salvar registro.' });
    }
  });

  // ROTA: Login de Usuário / Produtor
  app.post('/api/usuarios/login', async (request, reply) => {
    const { email, senha } = request.body as any;

    if (!email || !senha) {
      return reply.status(400).send({ erro: 'E-mail e senha são obrigatórios.' });
    }

    try {
      const usuario = await prisma.usuario.findUnique({
        where: { email },
        include: { fazenda: true },
      });

      if (!usuario || usuario.senhaHash !== senha) {
        return reply.status(401).send({ erro: 'Credenciais inválidas.' });
      }

      return reply.send({
        sucesso: true,
        mensagem: 'Login efetuado com sucesso!',
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          idade: usuario.idade,
          fazenda: usuario.fazenda ? {
            id: usuario.fazenda.id,
            nome: usuario.fazenda.nome,
            localizacao: usuario.fazenda.localizacao,
          } : null,
        },
      });
    } catch (error) {
      console.error('Erro no login do usuário:', error);
      return reply.status(500).send({ erro: 'Erro interno ao autenticar.' });
    }
  });

  // ROTA: Registro de Consumidor
  app.post('/api/consumidores/registrar', async (request, reply) => {
    const { nome, email, empresa, senha } = request.body as any;

    if (!nome || !email || !empresa || !senha) {
      return reply.status(400).send({ erro: 'Todos os campos são obrigatórios.' });
    }

    try {
      const consumidorExistente = await prisma.consumidor.findUnique({ where: { email } });
      if (consumidorExistente) {
        return reply.status(400).send({ erro: 'Este e-mail de parceiro já está cadastrado.' });
      }

      const novoConsumidor = await prisma.consumidor.create({
        data: { nome, email, empresa, senhaHash: senha }
      });

      return reply.status(201).send({
        sucesso: true,
        mensagem: 'Parceiro cadastrado com sucesso!',
        consumidorId: novoConsumidor.id,
      });
    } catch (error) {
      console.error('Erro no registro do consumidor:', error);
      return reply.status(500).send({ erro: 'Erro interno ao cadastrar parceiro.' });
    }
  });

  // ROTA: Login de Consumidor
  app.post('/api/consumidores/login', async (request, reply) => {
    const { email, senha } = request.body as any;

    if (!email || !senha) {
      return reply.status(400).send({ erro: 'E-mail e senha são obrigatórios.' });
    }

    try {
      const consumidor = await prisma.consumidor.findUnique({ where: { email } });
      if (!consumidor || consumidor.senhaHash !== senha) {
        return reply.status(401).send({ erro: 'Credenciais inválidas.' });
      }

      return reply.send({
        sucesso: true,
        mensagem: 'Login efetuado com sucesso!',
        consumidor: {
          id: consumidor.id,
          nome: consumidor.nome,
          empresa: consumidor.empresa,
          email: consumidor.email,
        },
      });
    } catch (error) {
      console.error('Erro no login do consumidor:', error);
      return reply.status(500).send({ erro: 'Erro interno ao autenticar.' });
    }
  });

  // ROTA: Buscar Lotes Disponíveis para Consumidores
  app.get('/api/lotes/disponiveis', async (request, reply) => {
    try {
      const lotes = await prisma.lote.findMany({
        where: { status: 'DISPONIVEL' },
        include: {
          fazenda: {
            include: {
              usuario: {
                select: { nome: true, telefone: true, email: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return reply.send({ sucesso: true, lotes });
    } catch (error) {
      console.error('Erro ao buscar lotes:', error);
      return reply.status(500).send({ erro: 'Falha ao buscar lotes disponíveis.' });
    }
  });
}