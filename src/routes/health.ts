import * as os from 'os';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Sequelize } from 'sequelize';
import { Builder } from '../decorators/builder';
import { Get } from '../decorators/routes';
import { makeResponses } from '../resources/openapi/responses';
import { FastAPI } from 'index';

interface Response {
  status: string;
  memory?: MemoryInfo;
  process?: ProcessInfo;
  os?: OsInfo;
  database?: DatabaseInfo;
  container?: ContainerInfo;
  app?: AppInfo;
}

interface MemoryInfo {
  total: number;
  free: number;
  used: number;
  active: number;
  available: number;
}

function getMemoryInfo(): MemoryInfo {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const active = total - free;
  const available = total - free;

  return {
    total,
    free,
    used,
    active,
    available
  };
}

interface ProcessInfo {
  pid: number;
  uptime: number;
  versions: NodeJS.ProcessVersions;
  memoryUsage: NodeJS.MemoryUsage;
}

function getProcessInfo(): ProcessInfo {
  const pid = process.pid;
  const uptime = process.uptime();
  const versions = process.versions;
  const memoryUsage = process.memoryUsage();

  return {
    pid,
    uptime,
    versions,
    memoryUsage
  };
}

interface OsInfo {
  hostname: string;
  type: string;
  platform: string;
  release: string;
  arch: string;
  uptime: number;
  cpus: number;
}

function getOsInfo(): OsInfo {
  const hostname = os.hostname();
  const type = os.type();
  const platform = os.platform();
  const release = os.release();
  const arch = os.arch();
  const uptime = os.uptime();
  const cpus = os.cpus().length;

  return {
    hostname,
    type,
    platform,
    release,
    arch,
    uptime,
    cpus
  };
}

interface DatabaseInfo {
  dialect: string;
  host: string;
  port: number;
  database: string;
  username: string;
}

function getDatabaseInfo(sequelize: Sequelize): DatabaseInfo {
  const dialect = sequelize.getDialect();
  const host = sequelize.config.host as string;
  const port = parseInt(sequelize.config.port as string);
  const database = sequelize.config.database;
  const username = sequelize.config.username;

  return {
    dialect,
    host,
    port,
    database,
    username
  };
}

interface ContainerInfo {
  image: string;
  version: string;
  containerId: string;
}

function getContainerInfo(): ContainerInfo {
  const image = process.env.IMAGE as string;
  const version = process.env.VERSION as string;
  const containerId = process.env.HOSTNAME as string;

  return {
    image,
    version,
    containerId
  };
}

interface AppInfo {
  image: string;
  version: string;
}

function getAppInfo(): AppInfo {
  const image = process.env.NAME as string;
  const version = process.env.VERSION as string;

  return {
    image,
    version
  };
}

export default class HealthRoute extends Builder {
  sequelize?: Sequelize;

  onLoad(fastAPI: FastAPI): void {
    if (fastAPI.sequelize === undefined) {
      throw new Error('Sequelize is not defined');
    }

    this.sequelize = fastAPI.sequelize;
  }

  @Get({
    path: '/health',
    tags: ['Health'],
    summary: 'Get health information',
    description: 'Get health information',
    responses: makeResponses('health', 200, {
      status: { type: 'string' }
    })
  })
  async health(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    reply.send({ status: 'UP' });
  }

  @Get({
    path: '/health/all',
    tags: ['Health'],
    summary: 'Get all health information',
    description: 'Get all health information',
    responses: makeResponses('health', 200, {
      server: {
        type: 'object',
        properties: {
          platform: { type: 'string' },
          release: { type: 'string' },
          arch: { type: 'string' },
          uptime: { type: 'number' },
          cpus: { type: 'number' }
        }
      },
      memory: {
        type: 'object',
        properties: {
          total: { type: 'number' },
          free: { type: 'number' },
          used: { type: 'number' },
          active: { type: 'number' },
          available: { type: 'number' }
        }
      },
      process: {
        type: 'object',
        properties: {
          pid: { type: 'number' },
          uptime: { type: 'number' },
          versions: { type: 'object' },
          memoryUsage: { type: 'object' }
        }
      },
      os: {
        type: 'object',
        properties: {
          hostname: { type: 'string' },
          type: { type: 'string' },
          platform: { type: 'string' },
          release: { type: 'string' },
          arch: { type: 'string' },
          uptime: { type: 'number' },
          cpus: { type: 'number' }
        },
        nullable: true
      },
      container: {
        type: 'object',
        properties: {
          image: { type: 'string' },
          version: { type: 'string' },
          containerId: { type: 'string' }
        },
        nullable: true
      },
      database: {
        type: 'object',
        properties: {
          dialect: { type: 'string' },
          host: { type: 'string' },
          port: { type: 'number' },
          database: { type: 'string' },
          username: { type: 'string' }
        },
        nullable: true
      },
      status: { type: 'string' }
    })
  })
  async all(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    reply.send({
      memory: getMemoryInfo(),
      process: getProcessInfo(),
      os: getOsInfo(),
      database:
        this.sequelize !== undefined
          ? getDatabaseInfo(this.sequelize as Sequelize)
          : null,
      container: getContainerInfo(),
      app: getAppInfo(),
      status: 'UP'
    } as Response);
  }
}
