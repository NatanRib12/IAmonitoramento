import fastify from 'fastify';
import multipart from '@fastify/multipart';
import cors from '@fastify/cors';
import { routes } from './routers/routes';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';

const app = fastify({ 
  logger: true,
  bodyLimit: 500 * 1024 * 1024 // 500 MB
});

// Habilita acesso para a aplicação React
app.register(cors, {
  origin: true
});

// Configura recebimento de multipart/form-data até 500MB
app.register(multipart, {
  limits: {
    fileSize: 500 * 1024 * 1024
  }
});

// Garante que a pasta 'uploads' exista antes de registrar o plugin estático
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.register(fastifyStatic, {
  root: uploadsDir,
  prefix: '/uploads/',
});

// Registra as rotas
app.register(routes);

const start = async () => {
  try {
    await app.listen({ port: 3333, host: '0.0.0.0' });
    console.log('Backend executando em http://localhost:3333');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();