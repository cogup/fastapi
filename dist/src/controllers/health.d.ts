import { FastifyReply, FastifyRequest } from 'fastify';
import { Sequelize } from 'sequelize';
import { Builder } from '../decorators/builder';
import { FastAPI } from 'index';
export default class HealthRoute extends Builder {
    sequelize?: Sequelize;
    onLoad(fastAPI: FastAPI): void;
    health(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    all(request: FastifyRequest, reply: FastifyReply): Promise<void>;
}
