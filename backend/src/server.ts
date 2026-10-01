import fastify from 'fastify';
import multipart from '@fastify/multipart';
import cors from '@fastify/cors';
import { routes } from './routers/routes';
import fastifyStatic from '@fastify/static';
import path from 'path';

const app = fastify({ logger: true });

// Habilita acesso para a aplicação React
app.register(cors, {
  origin: true
});

// Configura recebimento de vídeos até 100MB
app.register(multipart, {
  limits: {
    fileSize: 100 * 1024 * 1024
  }
});

const uploadsDir = path.resolve(process.cwd(), 'uploads');
app.register(fastifyStatic, {
  root: uploadsDir,
  prefix: '/uploads/',
});

// Registra as rotas
app.register(routes);

const start = async () => {
  try {
    await app.listen({ port: 3333, host: '0.0.0.0' });
    console.log('Backend em http://localhost:3333');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
