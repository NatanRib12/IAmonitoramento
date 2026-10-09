import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { processarVideoIA } from '../Service';
import fs from 'fs';
import path from 'path';
import os from 'os';

const prisma = new PrismaClient();

export async function routes(app: FastifyInstance) {

  // ROTA: Processamento de Vídeo por IA em Memória
  app.post('/api/videos/processar', async (request, reply) => {
    const data = await request.file();
    
    if (!data) {
      return reply.status(400).send({ erro: 'Nenhum vídeo enviado.' });
    }

    try {
      const buffer = await data.toBuffer();
      const mimeType = data.mimetype || 'video/mp4';
      const base64Original = `data:${mimeType};base64,${buffer.toString('base64')}`;

      const resultadoIA = await processarVideoIA(buffer);

      if (!resultadoIA || !resultadoIA.sucesso) {
        throw new Error(resultadoIA?.erro || 'Falha no processamento do motor de IA.');
      }

      let videoProcessadoFinal = base64Original;

      if (resultadoIA.video_processado) {
        let caminhoAnotado = path.isAbsolute(resultadoIA.video_processado)
          ? resultadoIA.video_processado
          : path.resolve(os.tmpdir(), resultadoIA.video_processado);

        if (!fs.existsSync(caminhoAnotado)) {
          caminhoAnotado = path.resolve(process.cwd(), 'uploads', resultadoIA.video_processado);
        }

        if (!fs.existsSync(caminhoAnotado)) {
          caminhoAnotado = path.resolve(process.cwd(), '../motorIA', resultadoIA.video_processado);
        }

        if (fs.existsSync(caminhoAnotado)) {
          const bufferAnotado = fs.readFileSync(caminhoAnotado);
          videoProcessadoFinal = `data:video/mp4;base64,${bufferAnotado.toString('base64')}`;

          try {
            fs.unlinkSync(caminhoAnotado);
          } catch (e) {
            console.error('Erro ao deletar vídeo anotado temporário:', e);
          }
        }
      }

      return reply.send({
        sucesso: true,
        mensagem: 'Processamento e laudo concluídos!',
        totalCabecas: resultadoIA.total_gado || 0,
        videoOriginalBase64: base64Original,
        videoProcessadoUrl: videoProcessadoFinal
      });

    } catch (error: any) {
      console.error('Erro no processamento do vídeo:', error);
      return reply.status(500).send({ erro: error.message || 'Falha ao processar o vídeo.' });
    }
  });

  // ROTA: Buscar todas as Fazendas de um Usuário
  app.get('/api/fazendas/usuario/:usuarioId', async (request, reply) => {
    const { usuarioId } = request.params as { usuarioId: string };

    if (!usuarioId) {
      return reply.status(400).send({ erro: 'ID do usuário é obrigatório.' });
    }

    try {
      const fazendas = await prisma.fazenda.findMany({
        where: { usuarioId },
        orderBy: { id: 'asc' }
      });

      return reply.send({
        sucesso: true,
        fazendas: fazendas.map((f: any) => ({
          id: f.id,
          nome: f.nome,
          localizacao: f.localizacao,
          areaValue: f.areaValue || 0,
          areaUnit: f.areaUnit || 'ha',
          cattleCapacity: f.cattleCapacity || 0
        }))
      });
    } catch (error) {
      console.error('Erro ao buscar fazendas do usuário:', error);
      return reply.status(500).send({ erro: 'Falha ao buscar lista de fazendas.' });
    }
  });

  // ROTA: Criar Nova Fazenda para Usuário Existente
  app.post('/api/fazendas', async (request, reply) => {
    const { usuarioId, name, location, areaValue, areaUnit, cattleCapacity } = request.body as any;

    if (!usuarioId || !name) {
      return reply.status(400).send({ erro: 'ID do usuário e nome da fazenda são obrigatórios.' });
    }

    try {
      const novaFazenda = await (prisma.fazenda as any).create({
        data: {
          nome: name,
          localizacao: location || 'Não informada',
          areaValue: Number(areaValue) || 0,
          areaUnit: areaUnit || 'ha',
          cattleCapacity: Number(cattleCapacity) || 0,
          usuarioId: usuarioId
        }
      });

      return reply.status(201).send({
        sucesso: true,
        mensagem: 'Fazenda cadastrada com sucesso!',
        fazenda: novaFazenda
      });
    } catch (error) {
      console.error('Erro ao criar fazenda:', error);
      return reply.status(500).send({ erro: 'Falha ao salvar nova fazenda no banco de dados.' });
    }
  });

  // ROTA: Atualizar Área, Capacidade e Dados da Fazenda
  app.put('/api/fazendas/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { areaValue, areaUnit, cattleCapacity, name, location } = request.body as any;

    try {
      const fazendaAtualizada = await (prisma.fazenda as any).update({
        where: { id },
        data: {
          areaValue: areaValue !== undefined ? Number(areaValue) : undefined,
          areaUnit: areaUnit || undefined,
          cattleCapacity: cattleCapacity !== undefined ? Number(cattleCapacity) : undefined,
          nome: name || undefined,
          localizacao: location || undefined
        }
      });

      return reply.send({
        sucesso: true,
        mensagem: 'Dados da fazenda atualizados permanentemente!',
        fazenda: fazendaAtualizada
      });
    } catch (error) {
      console.error('Erro ao atualizar fazenda:', error);
      return reply.status(500).send({ erro: 'Falha ao atualizar dados da fazenda.' });
    }
  });

  // ROTA: Salvar Vídeo Diretamente no Banco de Dados
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
          status: status || 'RASCUNHO',
          fazendaId: fazendaId
        }
      });

      return reply.status(201).send({
        sucesso: true,
        mensagem: 'Vídeo armazenado no Banco de Dados com sucesso!',
        lote: novoLote
      });
    } catch (error) {
      console.error('Erro ao salvar vídeo no Banco de Dados:', error);
      return reply.status(500).send({ erro: 'Erro interno ao salvar vídeo no banco de dados.' });
    }
  });

  app.delete('/api/videos/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    if (!id) {
      return reply.status(400).send({ erro: 'O ID do lote é obrigatório.' });
    }

    try {
      await prisma.lote.delete({ where: { id } });
      return reply.send({ sucesso: true, mensagem: 'Vídeo excluído permanentemente.' });
    } catch (error) {
      console.error('Erro ao deletar vídeo:', error);
      return reply.status(500).send({ erro: 'Falha ao deletar vídeo do banco de dados.' });
    }
  });

  // ROTA: Buscar Vídeos do Banco por Fazenda
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

      return reply.send({ sucesso: true, lotes });
    } catch (error) {
      console.error('Erro ao buscar vídeos:', error);
      return reply.status(500).send({ erro: 'Falha ao buscar biblioteca de vídeos.' });
    }
  });

  // ROTA: Publicar Lote no Mercado
  app.post('/api/lotes/publicar', async (request, reply) => {
    const { loteId, quantidadeCabecas, videoProcessadoUrl, fazendaId } = request.body as any;

    try {
      if (loteId) {
        const loteAtualizado = await prisma.lote.update({
          where: { id: loteId },
          data: {
            status: 'DISPONIVEL',
            quantidadeCabecas: quantidadeCabecas ? Number(quantidadeCabecas) : undefined
          }
        });

        return reply.send({
          sucesso: true,
          mensagem: 'Lote publicado no mercado com sucesso!',
          lote: loteAtualizado
        });
      }

      if (!fazendaId) {
        return reply.status(400).send({ erro: 'ID da fazenda não informado.' });
      }

      const novoLote = await prisma.lote.create({
        data: {
          quantidadeCabecas: Number(quantidadeCabecas) || 0,
          videoOriginalUrl: videoProcessadoUrl || '',
          videoProcessadoUrl: videoProcessadoUrl || '',
          status: 'DISPONIVEL',
          fazendaId: fazendaId
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

  // ROTA: Login de Usuário
  app.post('/api/usuarios/login', async (request, reply) => {
    const { email, senha } = request.body as any;

    if (!email || !senha) {
      return reply.status(400).send({ erro: 'E-mail e senha são obrigatórios.' });
    }

    try {
      const usuario = await prisma.usuario.findUnique({
        where: { email }
      });

      if (!usuario || usuario.senhaHash !== senha) {
        return reply.status(401).send({ erro: 'Credenciais inválidas.' });
      }

      const fazendas = await prisma.fazenda.findMany({
        where: { usuarioId: usuario.id }
      });

      return reply.send({
        sucesso: true,
        mensagem: 'Login efetuado com sucesso!',
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          idade: usuario.idade,
          fazendas: fazendas.map((f: any) => ({
            id: f.id,
            nome: f.nome,
            localizacao: f.localizacao,
            areaValue: f.areaValue || 0,
            areaUnit: f.areaUnit || 'ha',
            cattleCapacity: f.cattleCapacity || 0
          }))
        },
      });
    } catch (error) {
      console.error('Erro no login do usuário:', error);
      return reply.status(500).send({ erro: 'Erro interno ao autenticar.' });
    }
  });

  // ROTA: Registro de Produtor
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
          senhaHash: senha
        }
      });

      const novaFazenda = await (prisma.fazenda as any).create({
        data: {
          nome: nomeFazenda,
          localizacao,
          usuarioId: novoUsuario.id
        }
      });

      return reply.status(201).send({
        sucesso: true,
        mensagem: 'Usuário e Fazenda cadastrados com sucesso!',
        usuario: {
          id: novoUsuario.id,
          nome: novoUsuario.nome,
          email: novoUsuario.email,
          idade: novoUsuario.idade,
          fazendas: [novaFazenda]
        }
      });
    } catch (error) {
      console.error('Erro no registro do usuário:', error);
      return reply.status(500).send({ erro: 'Erro interno ao salvar registro.' });
    }
  });

  // ROTAS DE CONSUMIDOR
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