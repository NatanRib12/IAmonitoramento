import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { processarVideoIA } from '../Service';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';
import { DOMParser } from '@xmldom/xmldom';
import * as kmlToGeoJson from '@tmcw/togeojson';
import os from 'os';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY || 're_seu_api_key_aqui');

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
          cattleCapacity: f.cattleCapacity || 0,
          geojson: f.geojson || null
        }))
      });
    } catch (error) {
      console.error('Erro ao buscar fazendas do usuário:', error);
      return reply.status(500).send({ erro: 'Falha ao buscar lista de fazendas.' });
    }
  });

  // ROTA: Criar Nova Fazenda para Usuário Existente
  app.post('/api/fazendas', async (request, reply) => {
    const { usuarioId, name, location, areaValue, areaUnit, cattleCapacity, geojson } = request.body as any;

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
          usuarioId: usuarioId,
          geojson: geojson ? (typeof geojson === 'string' ? geojson : JSON.stringify(geojson)) : null
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
    const { areaValue, areaUnit, cattleCapacity, name, location, geojson } = request.body as any;

    try {
      const fazendaAtualizada = await (prisma.fazenda as any).update({
        where: { id },
        data: {
          areaValue: areaValue !== undefined ? Number(areaValue) : undefined,
          areaUnit: areaUnit || undefined,
          cattleCapacity: cattleCapacity !== undefined ? Number(cattleCapacity) : undefined,
          nome: name || undefined,
          localizacao: location || undefined,
          geojson: geojson !== undefined ? (typeof geojson === 'string' ? geojson : JSON.stringify(geojson)) : undefined
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

  // ROTA: Upload de KML
  app.post('/api/fazendas/:fazendaId/kml', async (request, reply) => {
    const { fazendaId } = request.params as { fazendaId: string };
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ erro: 'Nenhum arquivo KML foi enviado.' });
    }

    try {
      const fazendaExiste = await (prisma.fazenda as any).findUnique({
        where: { id: fazendaId }
      });

      if (!fazendaExiste) {
        return reply.status(404).send({ erro: 'A fazenda informada não existe no banco de dados.' });
      }

      const buffer = await data.toBuffer();
      const kmlString = buffer.toString('utf-8');
      const dom = new DOMParser().parseFromString(kmlString, 'text/xml');
      const convertedGeoJSON = kmlToGeoJson.kml(dom);

      const fazendaAtualizada = await (prisma.fazenda as any).update({
        where: { id: fazendaId },
        data: {
          geojson: JSON.stringify(convertedGeoJSON)
        }
      });

      return reply.send({
        sucesso: true,
        mensagem: 'Mapa digitalizado do terreno importado com sucesso!',
        geojson: convertedGeoJSON,
        fazenda: fazendaAtualizada
      });

    } catch (error: any) {
      console.error('Erro ao processar KML:', error);
      return reply.status(500).send({ erro: 'Falha ao ler e processar o arquivo KML.' });
    }
  });

  // ROTA: Criar Pasto
  app.post('/api/fazendas/:fazendaId/pastos', async (request, reply) => {
    const { fazendaId } = request.params as { fazendaId: string };
    const { nome, geojson } = request.body as { nome: string; geojson?: any };

    if (!nome || !nome.trim()) {
      return reply.status(400).send({ erro: 'O nome do pasto é obrigatório.' });
    }

    try {
      const novoPasto = await prisma.pasto.create({
        data: {
          nome: nome.trim(),
          geojson: geojson ? (typeof geojson === 'string' ? geojson : JSON.stringify(geojson)) : null,
          fazendaId: fazendaId
        }
      });

      return reply.status(201).send({
        sucesso: true,
        mensagem: 'Pasto/Piquete cadastrado com sucesso!',
        pasto: novoPasto
      });
    } catch (error) {
      console.error('Erro ao criar pasto:', error);
      return reply.status(500).send({ erro: 'Falha ao cadastrar o pasto.' });
    }
  });

  // ROTA: Listar Pastos de uma Fazenda
  app.get('/api/fazendas/:fazendaId/pastos', async (request, reply) => {
    const { fazendaId } = request.params as { fazendaId: string };

    try {
      const pastos = await prisma.pasto.findMany({
        where: { fazendaId },
        orderBy: { nome: 'asc' }
      });

      return reply.send({ sucesso: true, pastos });
    } catch (error) {
      console.error('Erro ao buscar pastos:', error);
      return reply.status(500).send({ erro: 'Falha ao buscar lista de pastos.' });
    }
  });

  app.put('/api/pastos/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { nome } = request.body as { nome: string };

    try {
      const pastoAtualizado = await prisma.pasto.update({
        where: { id },
        data: { nome }
      });

      return reply.send({ sucesso: true, pasto: pastoAtualizado });
    } catch (error) {
      return reply.status(500).send({ erro: 'Falha ao atualizar o nome do pasto.' });
    }
  });

  app.delete('/api/pastos/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await prisma.pasto.delete({ where: { id } });
      return reply.send({ sucesso: true, mensagem: 'Demarcação removida com sucesso.' });
    } catch (error) {
      console.error('Erro ao deletar pasto:', error);
      return reply.status(500).send({ erro: 'Falha ao deletar pasto.' });
    }
  });

  app.delete('/api/fazendas/:fazendaId/pastos', async (request, reply) => {
    const { fazendaId } = request.params as { fazendaId: string };

    try {
      await prisma.pasto.deleteMany({
        where: { fazendaId }
      });

      return reply.send({
        sucesso: true,
        mensagem: 'Todos os pastos acumulados foram removidos com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao limpar pastos:', error);
      return reply.status(500).send({ erro: 'Falha ao limpar pastos da fazenda.' });
    }
  });

  // ROTA: Salvar Vídeo no Banco
  app.post('/api/videos/salvar-galeria', async (request, reply) => {
    const { 
      fazendaId, 
      pastoId,
      quantidadeCabecas, 
      valorTotal, 
      videoOriginalUrl, 
      videoProcessadoUrl, 
      status 
    } = request.body as any;

    if (!fazendaId) {
      return reply.status(400).send({ erro: 'O ID da fazenda é obrigatório.' });
    }

    try {
      const novoLote = await prisma.lote.create({
        data: {
          quantidadeCabecas: Number(quantidadeCabecas) || 0,
          valorTotal: Number(valorTotal) || 0,
          videoOriginalUrl: videoOriginalUrl || '',
          videoProcessadoUrl: videoProcessadoUrl || '',
          status: status || 'RASCUNHO',
          fazendaId: fazendaId,
          pastoId: pastoId || null
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

app.get('/api/videos/minha-fazenda', async (request, reply) => {
    const { fazendaId } = request.query as { fazendaId?: string };

    if (!fazendaId) {
      return reply.status(400).send({ erro: 'ID da fazenda é necessário.' });
    }

    try {
      const lotes = await prisma.lote.findMany({
        where: { fazendaId },
        select: {
          id: true,
          quantidadeCabecas: true,
          valorTotal: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          fazendaId: true,
          pastoId: true,
          consumerId: true,
          consumerName: true,
          consumerCompany: true,
          consumerPhone: true
          // videoOriginalUrl e videoProcessadoUrl omitidos na listagem para não estourar o buffer N-API do Prisma
        },
        orderBy: { createdAt: 'desc' }
      });

      return reply.send({ sucesso: true, lotes });
    } catch (error) {
      console.error('Erro ao buscar vídeos:', error);
      return reply.status(500).send({ erro: 'Falha ao buscar biblioteca de vídeos.' });
    }
  });

  // ROTA: Publicar Lote (Sem erro no include do AlertaRadar)
  app.post('/api/lotes/publicar', async (request, reply) => {
    const { loteId, quantidadeCabecas, valorTotal, videoProcessadoUrl, fazendaId } = request.body as any;

    try {
      let lotePublicado: any = null;

      if (loteId) {
        lotePublicado = await prisma.lote.update({
          where: { id: loteId },
          data: {
            status: 'DISPONIVEL',
            quantidadeCabecas: quantidadeCabecas ? Number(quantidadeCabecas) : undefined,
            valorTotal: valorTotal !== undefined && valorTotal !== null ? Number(valorTotal) : undefined
          },
          include: {
            fazenda: {
              include: {
                usuario: true
              }
            }
          }
        });
      } else if (fazendaId) {
        lotePublicado = await prisma.lote.create({
          data: {
            quantidadeCabecas: Number(quantidadeCabecas) || 0,
            valorTotal: valorTotal ? Number(valorTotal) : 0,
            videoOriginalUrl: videoProcessadoUrl || '',
            videoProcessadoUrl: videoProcessadoUrl || '',
            status: 'DISPONIVEL',
            fazendaId: fazendaId
          },
          include: {
            fazenda: {
              include: {
                usuario: true
              }
            }
          }
        });
      } else {
        return reply.status(400).send({ erro: 'ID da fazenda ou do lote não informado.' });
      }

      const qtdCabecas = lotePublicado.quantidadeCabecas || 0;
      const valorFormatado = lotePublicado.valorTotal 
        ? Number(lotePublicado.valorTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : 'A combinar';

      const minQtd = Math.max(1, qtdCabecas - 10);
      const maxQtd = qtdCabecas + 10;

      try {
        // CORRIGIDO: Removido include de usuario inexistente no AlertaRadar
        const alertasCompativeis = await (prisma as any).alertaRadar.findMany({
          where: {
            quantidadeDesejada: {
              gte: minQtd,
              lte: maxQtd
            }
          },
          include: {
            consumidor: true
          }
        });

        for (const alerta of alertasCompativeis) {
          const destinatarioEmail = alerta.consumidor?.email;
          if (!destinatarioEmail) continue;

          if (
            alerta.regiao &&
            lotePublicado.fazenda?.localizacao &&
            !lotePublicado.fazenda.localizacao.toLowerCase().includes(alerta.regiao.toLowerCase())
          ) {
            continue;
          }

          await resend.emails.send({
            from: 'AgroIntelli Radar <notificacoes@agrointelli.com>',
            to: [destinatarioEmail],
            subject: `🎯 Novo Lote Encontrado: ${qtdCabecas} gados em ${lotePublicado.fazenda?.nome || 'Fazenda'}`,
            html: `
              <div style="font-family: sans-serif; color: #334155; padding: 20px;">
                <h2 style="color: #059669;">Novo Lote Auditado Encontrado no Radar AgroIntelli!</h2>
                <p>Olá! Um novo lote foi publicado no mercado e atende aos critérios do seu alerta de interesse.</p>
                
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 15px 0;">
                  <p style="margin: 4px 0;"><strong>Fazenda:</strong> ${lotePublicado.fazenda?.nome || 'Propriedade Rural'}</p>
                  <p style="margin: 4px 0;"><strong>Localização:</strong> ${lotePublicado.fazenda?.localizacao || 'Não informada'}</p>
                  <p style="margin: 4px 0;"><strong>Volume Disponível:</strong> ${qtdCabecas} cabeças</p>
                  <p style="margin: 4px 0;"><strong>Valor do Lote:</strong> ${valorFormatado}</p>
                  <p style="margin: 4px 0;"><strong>Vendedor/Produtor:</strong> ${lotePublicado.fazenda?.usuario?.nome || 'Produtor'}</p>
                </div>

                <p>Acesse o painel do consumidor na plataforma AgroIntelli para iniciar a negociação via WhatsApp!</p>
              </div>
            `
          });
        }
      } catch (errEmail) {
        console.error('Erro ao processar notificações do Resend:', errEmail);
      }

      return reply.send({
        sucesso: true,
        mensagem: 'Lote disponibilizado para o mercado!',
        lote: lotePublicado
      });
    } catch (error) {
      console.error('Erro ao publicar lote:', error);
      return reply.status(500).send({ erro: 'Falha ao publicar lote no mercado.' });
    }
  });

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
            cattleCapacity: f.cattleCapacity || 0,
            geojson: f.geojson || null
          }))
        },
      });
    } catch (error) {
      console.error('Erro no login do usuário:', error);
      return reply.status(500).send({ erro: 'Erro interno ao autenticar.' });
    }
  });

  app.post('/api/usuarios/registrar', async (request, reply) => {
    const { nome, email, idade, senha, nomeFazenda, localizacao, capacidadeGado, areaValue, areaUnit } = request.body as any;

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
          areaValue: Number(areaValue) || 0,
          areaUnit: areaUnit || 'ha',
          cattleCapacity: Number(capacidadeGado) || 0,
          usuarioId: novoUsuario.id
        }
      });

      return reply.status(201).send({
        sucesso: true,
        mensagem: 'Usuário e Fazenda cadastrados com sucesso!',
        usuarioId: novoUsuario.id,
        fazendaId: novaFazenda.id,
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

  app.get('/api/alertas', async (request, reply) => {
    const { consumidorId, usuarioId } = request.query as { consumidorId?: string; usuarioId?: string };

    try {
      const whereCondition: any = {};
      if (consumidorId) whereCondition.consumidorId = consumidorId;
      if (usuarioId) whereCondition.usuarioId = usuarioId;

      const alertas = await (prisma as any).alertaRadar.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' }
      });

      return reply.send({ sucesso: true, alertas });
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      return reply.status(500).send({ erro: 'Falha ao buscar alertas do radar.' });
    }
  });

  app.post('/api/alertas', async (request, reply) => {
    const { regiao, quantidadeDesejada, consumidorId } = request.body as any;

    if (!quantidadeDesejada) {
      return reply.status(400).send({ erro: 'A quantidade desejada é obrigatória.' });
    }

    if (!consumidorId) {
      return reply.status(400).send({ erro: 'É necessário estar autenticado como comprador para criar alertas.' });
    }

    try {
      const novoAlerta = await (prisma as any).alertaRadar.create({
        data: {
          regiao: regiao?.trim() || null,
          quantidadeDesejada: Number(quantidadeDesejada),
          consumidorId: consumidorId
        }
      });

      return reply.status(201).send({
        sucesso: true,
        mensagem: 'Alerta cadastrado no radar com sucesso!',
        alerta: novoAlerta
      });
    } catch (error) {
      console.error('Erro ao criar alerta no banco:', error);
      return reply.status(500).send({ erro: 'Falha ao salvar alerta no banco de dados.' });
    }
  });

  app.delete('/api/alertas/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    if (!id) {
      return reply.status(400).send({ erro: 'ID do alerta é obrigatório.' });
    }

    try {
      await (prisma as any).alertaRadar.delete({ where: { id } });
      return reply.send({ sucesso: true, mensagem: 'Alerta removido com sucesso.' });
    } catch (error) {
      console.error('Erro ao remover alerta:', error);
      return reply.status(500).send({ erro: 'Falha ao remover alerta.' });
    }
  });

  app.post('/api/chamados', async (request, reply) => {
    const { usuarioId, subject, message, fazendaNome } = request.body as {
      usuarioId: string;
      subject?: string;
      message: string;
      fazendaNome?: string;
    };

    if (!usuarioId || !message) {
      return reply.status(400).send({ erro: 'ID do usuário e mensagem são obrigatórios.' });
    }

    try {
      const usuarioExiste = await prisma.usuario.findUnique({ where: { id: usuarioId } });
      const consumidorExiste = await prisma.consumidor.findUnique({ where: { id: usuarioId } });

      if (!usuarioExiste && !consumidorExiste) {
        return reply.status(400).send({ 
          erro: 'Usuário/Consumidor não encontrado. Por favor, faça login novamente.' 
        });
      }

      const dataChamado: any = {
        subject: subject || 'Atendimento Geral',
        message: message,
        fazendaNome: fazendaNome || 'Não informada',
        status: 'Em análise'
      };

      if (usuarioExiste) {
        dataChamado.usuarioId = usuarioId;
      } else if (consumidorExiste) {
        dataChamado.consumidorId = usuarioId;
      }

      const novoChamado = await (prisma as any).chamado.create({
        data: dataChamado
      });

      return reply.status(201).send({ sucesso: true, chamado: novoChamado });
    } catch (error) {
      console.error('Erro ao abrir chamado:', error);
      return reply.status(500).send({ erro: 'Falha ao registrar chamado.' });
    }
  });

  app.get('/api/chamados/usuario/:usuarioId', async (request, reply) => {
    const { usuarioId } = request.params as { usuarioId: string };

    if (!usuarioId) {
      return reply.status(400).send({ erro: 'ID é obrigatório.' });
    }

    try {
      const chamados = await (prisma as any).chamado.findMany({
        where: {
          OR: [
            { usuarioId: usuarioId },
            { consumidorId: usuarioId }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });

      return reply.send({
        sucesso: true,
        chamados
      });
    } catch (error) {
      console.error('Erro ao buscar chamados:', error);
      return reply.status(500).send({ erro: 'Falha ao carregar chamados do banco de dados.' });
    }
  });

  app.put('/api/lotes/:id/reservar', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { consumidorId, consumerName, consumerCompany, consumerPhone } = request.body as any;

    if (!id) {
      return reply.status(400).send({ erro: 'ID do lote é obrigatório.' });
    }

    try {
      const loteAtualizado = await prisma.lote.update({
        where: { id },
        data: {
          status: 'RESERVADO',
          consumerId: consumidorId || null,
          consumerName: consumerName || null,
          consumerCompany: consumerCompany || null,
          consumerPhone: consumerPhone || null
        }
      });

      return reply.send({
        sucesso: true,
        mensagem: 'Lote reservado com sucesso no banco de dados!',
        lote: loteAtualizado
      });
    } catch (error) {
      console.error('Erro ao reservar lote no banco:', error);
      return reply.status(500).send({ erro: 'Falha ao registrar reserva no banco de dados.' });
    }
  });

  app.get('/api/lotes/reservados/consumidor/:consumidorId', async (request, reply) => {
    const { consumidorId } = request.params as { consumidorId: string };

    if (!consumidorId) {
      return reply.status(400).send({ erro: 'ID do consumidor é obrigatório.' });
    }

    try {
      const lotes = await prisma.lote.findMany({
        where: {
          consumerId: consumidorId,
          status: {
            in: ['RESERVADO', 'ANALISE_CLIENTE', 'RECUSADO_CLIENTE']
          }
        } as any,
        include: {
          fazenda: {
            include: {
              usuario: {
                select: { nome: true, telefone: true, email: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' } as any
      });

      return reply.send({ sucesso: true, lotes });
    } catch (error) {
      console.error('Erro ao buscar reservas do consumidor:', error);
      return reply.status(500).send({ erro: 'Falha ao buscar lotes reservados.' });
    }
  });

  app.get('/api/lotes/compras/consumidor/:consumidorId', async (request, reply) => {
    const { consumidorId } = request.params as { consumidorId: string };

    if (!consumidorId) {
      return reply.status(400).send({ erro: 'ID do consumidor é obrigatório.' });
    }

    try {
      const compras = await prisma.lote.findMany({
        where: {
          consumerId: consumidorId,
          status: 'VENDIDO'
        } as any,
        include: {
          fazenda: {
            include: {
              usuario: {
                select: { nome: true, telefone: true, email: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' } as any
      });

      return reply.send({ sucesso: true, compras });
    } catch (error) {
      console.error('Erro ao buscar histórico de compras do consumidor:', error);
      return reply.status(500).send({ erro: 'Falha ao buscar compras anteriores.' });
    }
  });

  app.put('/api/lotes/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status, quantidadeCabecasFinal } = request.body as any;

    if (!id || !status) {
      return reply.status(400).send({ erro: 'ID do lote e novo status são obrigatórios.' });
    }

    try {
      const loteAtualizado = await prisma.lote.update({
        where: { id },
        data: {
          status,
          quantidadeCabecas: quantidadeCabecasFinal ? Number(quantidadeCabecasFinal) : undefined
        }
      });

      return reply.send({
        sucesso: true,
        mensagem: 'Status do lote atualizado com sucesso!',
        lote: loteAtualizado
      });
    } catch (error) {
      console.error('Erro ao atualizar status do lote:', error);
      return reply.status(500).send({ erro: 'Falha ao atualizar status do lote.' });
    }
  });

  // ROTA: Confirmar Proposta SEM Sobrescrever a Leitura Original da IA
  app.put('/api/lotes/:id/confirmar-negociacao', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { quantidadeCabecas, valorTotal } = request.body as any;

    if (!id) {
      return reply.status(400).send({ erro: 'ID do lote é obrigatório.' });
    }

    try {
      const loteExistente = await prisma.lote.findUnique({ where: { id } });

      if (!loteExistente) {
        return reply.status(404).send({ erro: 'Lote não encontrado.' });
      }

      const propQtd = quantidadeCabecas ? Number(quantidadeCabecas) : loteExistente.quantidadeCabecas;
      const propVal = valorTotal !== undefined ? Number(valorTotal) : loteExistente.valorTotal;

      let phoneData: any = {};
      try {
        phoneData = loteExistente.consumerPhone && loteExistente.consumerPhone.startsWith('{')
          ? JSON.parse(loteExistente.consumerPhone)
          : { phone: loteExistente.consumerPhone || '' };
      } catch (e) {
        phoneData = { phone: loteExistente.consumerPhone || '' };
      }

      phoneData.propostaQtd = propQtd;
      phoneData.propostaValor = propVal;

      const loteAtualizado = await prisma.lote.update({
        where: { id },
        data: {
          consumerPhone: JSON.stringify(phoneData),
          status: 'ANALISE_CLIENTE'
        }
      });

      return reply.send({
        sucesso: true,
        mensagem: 'Proposta registrada sem alterar a contagem original da IA!',
        lote: loteAtualizado
      });
    } catch (error) {
      console.error('Erro ao confirmar negociação do lote:', error);
      return reply.status(500).send({ erro: 'Falha ao atualizar negociação do lote.' });
    }
  });

  app.put('/api/lotes/:id/aceitar-proposta', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const loteAtualizado = await prisma.lote.update({
        where: { id },
        data: { status: 'VENDIDO' }
      });

      return reply.send({
        sucesso: true,
        mensagem: 'Proposta aceita! Compra confirmada.',
        lote: loteAtualizado
      });
    } catch (error) {
      console.error('Erro ao aceitar proposta:', error);
      return reply.status(500).send({ erro: 'Falha ao aceitar proposta.' });
    }
  });

  app.put('/api/lotes/:id/recusar-proposta', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const loteExistente = (await prisma.lote.findUnique({ where: { id } })) as any;

      if (!loteExistente) {
        return reply.status(404).send({ erro: 'Lote não encontrado.' });
      }

      const recusasAtuais = Number(loteExistente.recusasCount || 0) + 1;

      if (recusasAtuais >= 2) {
        const loteCancelado = await prisma.lote.update({
          where: { id },
          data: {
            status: 'DISPONIVEL',
            consumerId: null,
            consumerName: null,
            consumerCompany: null,
            consumerPhone: null,
            recusasCount: 0
          } as any
        });

        return reply.send({
          sucesso: true,
          segundaRecusa: true,
          mensagem: 'Processo de compra cancelado. O lote retornou ao mercado público.',
          lote: loteCancelado
        });
      } else {
        const loteAtualizado = await prisma.lote.update({
          where: { id },
          data: {
            status: 'RECUSADO_CLIENTE',
            recusasCount: recusasAtuais
          } as any
        });

        return reply.send({
          sucesso: true,
          segundaRecusa: false,
          mensagem: 'Proposta recusada. Lote enviado de volta ao produtor.',
          lote: loteAtualizado
        });
      }
    } catch (error) {
      console.error('Erro ao recusar proposta:', error);
      return reply.status(500).send({ erro: 'Falha ao processar recusa da proposta.' });
    }
  });

  app.get('/api/fazendas/buscar-publico', async (request, reply) => {
    const { q } = request.query as { q?: string };

    try {
      const fazendas = await prisma.fazenda.findMany({
        where: q ? { nome: { contains: q, mode: 'insensitive' } } : {},
        select: {
          id: true,
          nome: true,
          localizacao: true,
          usuario: { select: { nome: true } }
        },
        take: 8
      });

      return reply.send({
        sucesso: true,
        fazendas: fazendas.map((f: any) => ({
          id: f.id,
          nome: f.nome,
          localizacao: f.localizacao,
          produtorNome: f.usuario?.nome || 'Produtor'
        }))
      });
    } catch (error) {
      console.error('Erro ao buscar fazendas:', error);
      return reply.status(500).send({ erro: 'Erro ao buscar fazendas.' });
    }
  });

  app.get('/api/fazendas/:fazendaId/analise-fornecedor', async (request, reply) => {
    const { fazendaId } = request.params as { fazendaId: string };

    try {
      const fazenda = await prisma.fazenda.findUnique({
        where: { id: fazendaId },
        select: {
          id: true,
          nome: true,
          localizacao: true,
          usuario: { select: { nome: true } }
        }
      });

      if (!fazenda) {
        return reply.status(404).send({ erro: 'Fazenda não encontrada.' });
      }

      const lotes = await prisma.lote.findMany({
        where: { fazendaId },
        select: {
          id: true,
          quantidadeCabecas: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return reply.send({
        sucesso: true,
        fazenda: {
          id: fazenda.id,
          nome: fazenda.nome,
          localizacao: fazenda.localizacao,
          produtorNome: fazenda.usuario?.nome || 'Produtor'
        },
        lotes: lotes.map((l) => {
          const cabecas = Number(l.quantidadeCabecas || 0);
          const vendida = l.status === 'VENDIDO' ? cabecas : 0;

          return {
            id: l.id,
            quantidadeCabecas: cabecas,
            quantidadeVendida: vendida,
            status: l.status || 'DISPONIVEL',
            createdAt: l.createdAt
          };
        })
      });
    } catch (error) {
      console.error('Erro na análise do fornecedor:', error);
      return reply.status(500).send({ erro: 'Falha ao buscar histórico de vendas da fazenda.' });
    }
  });

}