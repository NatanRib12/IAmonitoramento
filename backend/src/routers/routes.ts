import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { processarVideoIA } from '../Service';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

const prisma = new PrismaClient();

export async function routes(app: FastifyInstance) {

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

  app.post('/api/usuarios/registrar', async (request, reply) => {
    const { nome, email, idade, senha, nomeFazenda, localizacao } = request.body as any;

    if (!nome || !email || !idade || !senha || !nomeFazenda || !localizacao) {
      return reply.status(400).send({ erro: 'Todos os campos são obrigatórios.' });
    }

    try {
      // 1. Verifica se e-mail já existe
      const usuarioExistente = await prisma.usuario.findUnique({
        where: { email },
      });

      if (usuarioExistente) {
        return reply.status(400).send({ erro: 'Este e-mail já está cadastrado.' });
      }

      // 2. Criação direta no Prisma sem hash de senha
      const novoUsuario = await prisma.usuario.create({
        data: {
          nome,
          email,
          idade: Number(idade),
          senhaHash: senha, // Armazena o texto simples diretamente para a apresentação
          fazenda: {
            create: {
              nome: nomeFazenda,
              localizacao,
            },
          },
        },
        include: {
          fazenda: true,
        },
      });

      return reply.status(201).send({
        sucesso: true,
        mensagem: 'Usuário e Fazenda cadastrados com sucesso!',
        usuarioId: novoUsuario.id,
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
    const consumidorExistente = await prisma.consumidor.findUnique({
      where: { email },
    });

    if (consumidorExistente) {
      return reply.status(400).send({ erro: 'Este e-mail de parceiro já está cadastrado.' });
    }

    const novoConsumidor = await prisma.consumidor.create({
      data: {
        nome,
        email,
        empresa,
        senhaHash: senha, 
      },
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

// ROTA: Login de Consumidor / Parceiro
app.post('/api/consumidores/login', async (request, reply) => {
  const { email, senha } = request.body as any;

  if (!email || !senha) {
    return reply.status(400).send({ erro: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const consumidor = await prisma.consumidor.findUnique({
      where: { email },
    });

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

app.post('/api/lotes/publicar', async (request, reply) => {
  const { quantidadeCabecas, videoProcessadoUrl, fazendaId } = request.body as any;

  if (!quantidadeCabecas) {
    return reply.status(400).send({ erro: 'Quantidade de cabeças é obrigatória.' });
  }

  try {
    // Busca ou utiliza a primeira fazenda cadastrada (para facilidade de apresentação)
    let targetFazendaId = fazendaId;

    if (!targetFazendaId) {
      const primeiraFazenda = await prisma.fazenda.findFirst();
      if (primeiraFazenda) {
        targetFazendaId = primeiraFazenda.id;
      } else {
        // Cria fazenda padrão caso não exista
        const novaFazenda = await prisma.fazenda.create({
          data: {
            nome: 'Fazenda Santa Maria',
            localizacao: 'Ribeirão Preto - SP',
            usuario: {
              create: {
                nome: 'Natan Santos',
                email: 'produtor@agrointelli.com',
                telefone: '(16) 99876-5432',
                idade: 28,
                senhaHash: '12345678'
              }
            }
          }
        });
        targetFazendaId = novaFazenda.id;
      }
    }

    const novoLote = await prisma.lote.create({
      data: {
        quantidadeCabecas: Number(quantidadeCabecas),
        videoOriginalUrl: videoProcessadoUrl || '',
        status: 'DISPONIVEL',
        fazendaId: targetFazendaId,
      },
    });

    return reply.status(201).send({
      sucesso: true,
      mensagem: 'Lote publicado com sucesso no Mercado!',
      lote: novoLote,
    });
  } catch (error) {
    console.error('Erro ao publicar lote:', error);
    return reply.status(500).send({ erro: 'Falha ao disponibilizar lote para o mercado.' });
  }
});

// ROTA: Buscar Lotes Disponíveis (Para a Tela do Consumidor)
app.get('/api/lotes/disponiveis', async (request, reply) => {
  try {
    const lotes = await prisma.lote.findMany({
      where: { status: 'DISPONIVEL' },
      include: {
        fazenda: {
          include: {
            usuario: {
              select: {
                nome: true,
                telefone: true,
                email: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return reply.send({
      sucesso: true,
      lotes,
    });
  } catch (error) {
    console.error('Erro ao buscar lotes:', error);
    return reply.status(500).send({ erro: 'Falha ao buscar lotes disponíveis.' });
  }
});
}