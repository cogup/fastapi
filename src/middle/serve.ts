import fastify, { FastifyInstance } from 'fastify';

export default () => {
  const api: FastifyInstance = fastify({ logger: true });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  api.register(require('@fastify/cors'), {
    origin: '*'
  });

  return api;
};
