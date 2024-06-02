"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const os = __importStar(require("os"));
const builder_1 = require("../decorators/builder");
const routes_1 = require("../decorators/routes");
const responses_1 = require("../resources/openapi/responses");
function getMemoryInfo() {
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
function getProcessInfo() {
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
function getOsInfo() {
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
function getDatabaseInfo(sequelize) {
    const dialect = sequelize.getDialect();
    const host = sequelize.config.host;
    const port = parseInt(sequelize.config.port);
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
function getContainerInfo() {
    const image = process.env.IMAGE;
    const version = process.env.VERSION;
    const containerId = process.env.HOSTNAME;
    return {
        image,
        version,
        containerId
    };
}
function getAppInfo() {
    const image = process.env.NAME;
    const version = process.env.VERSION;
    return {
        image,
        version
    };
}
class HealthRoute extends builder_1.Builder {
    sequelize;
    onLoad(fastAPI) {
        if (fastAPI.sequelize === undefined) {
            throw new Error('Sequelize is not defined');
        }
        this.sequelize = fastAPI.sequelize;
    }
    async health(request, reply) {
        reply.send({ status: 'UP' });
    }
    async all(request, reply) {
        reply.send({
            memory: getMemoryInfo(),
            process: getProcessInfo(),
            os: getOsInfo(),
            database: this.sequelize !== undefined
                ? getDatabaseInfo(this.sequelize)
                : null,
            container: getContainerInfo(),
            app: getAppInfo(),
            status: 'UP'
        });
    }
}
exports.default = HealthRoute;
__decorate([
    (0, routes_1.Get)({
        path: '/health',
        tags: ['Health'],
        summary: 'Get health information',
        description: 'Get health information',
        responses: (0, responses_1.makeResponses)('health', 200, {
            status: { type: 'string' }
        })
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], HealthRoute.prototype, "health", null);
__decorate([
    (0, routes_1.Get)({
        path: '/health/all',
        tags: ['Health'],
        summary: 'Get all health information',
        description: 'Get all health information',
        responses: (0, responses_1.makeResponses)('health', 200, {
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
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], HealthRoute.prototype, "all", null);