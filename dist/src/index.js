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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelName = exports.Decorators = exports.DataTypes = exports.HandlerMethodType = exports.log = exports.Model = exports.ColumnType = exports.TableBuilder = exports.AutoColumn = exports.SchemaBuilder = exports.makeResponses = exports.RoutesBuilder = exports.PathBuilder = exports.FastAPI = void 0;
const serve_1 = __importDefault(require("./middle/serve"));
const openapi_1 = require("./resources/openapi");
const routes_1 = require("./resources/routes");
Object.defineProperty(exports, "HandlerMethodType", { enumerable: true, get: function () { return routes_1.HandlerMethodType; } });
const sequelize_1 = require("./resources/sequelize");
Object.defineProperty(exports, "Model", { enumerable: true, get: function () { return sequelize_1.SequelizeModel; } });
const health_1 = __importDefault(require("./routes/health"));
const events_1 = require("./resources/events");
const sequelize_2 = require("sequelize");
const util_1 = require("util");
const log_1 = __importDefault(require("./resources/log"));
exports.log = log_1.default;
const fs = __importStar(require("fs"));
const openapi_2 = __importDefault(require("./routes/openapi"));
const makes_1 = require("./routes/makes");
// get package.json version
const rootPath = process.cwd();
const packagePath = `${rootPath}/package.json`;
const version = require(packagePath).version;
class FastAPI {
    info = {
        title: 'FastAPI',
        description: 'FastAPI',
        version
    };
    servers = [];
    listenConfig = {
        port: 3000,
        host: '0.0.0.0'
    };
    routes = [];
    tags = {
        create: ['create'],
        read: ['read'],
        update: ['update'],
        delete: ['delete'],
        list: ['list']
    };
    handlers = {};
    schema;
    resources = {};
    models = {};
    database = {
        host: 'localhost',
        port: 5432,
        dialect: 'postgres',
        logging: undefined,
        sync: {
            force: false
        }
    };
    cors = {
        origin: '*'
    };
    forceCreateTables = false;
    api;
    databaseLoaded = false;
    listen;
    sequelize;
    openapiSpec;
    constructor(props) {
        if (props) {
            if (props.schema !== undefined) {
                this.schema = props.schema;
            }
            if (props.routes !== undefined) {
                this.routes = props.routes;
            }
            if (props.handlers !== undefined) {
                this.handlers = props.handlers;
            }
            if (props.tags !== undefined) {
                this.tags = props.tags;
            }
            if (props.database !== undefined) {
                this.database = { ...this.database, ...props.database };
            }
            if (props.cors !== undefined) {
                this.cors = props.cors;
            }
            if (props.forceCreateTables) {
                this.forceCreateTables = props.forceCreateTables;
            }
            if (props.listen !== undefined) {
                this.listenConfig = props.listen;
            }
            if (props.info !== undefined) {
                this.info = props.info;
            }
            if (props.server !== undefined) {
                this.servers = props.server;
            }
            else {
                this.servers = [
                    {
                        url: `http://localhost:${this.listenConfig.port}`,
                        description: 'Local server'
                    }
                ];
            }
        }
        this.api = (0, serve_1.default)();
        this.listen = (0, util_1.promisify)(this.api.listen.bind(this.api));
        return this;
    }
    loadDatabaseInstance() {
        if (this.databaseLoaded)
            return;
        const { uri, ...database } = this.database;
        if (uri) {
            this.sequelize = new sequelize_2.Sequelize(uri, database);
        }
        else {
            this.sequelize = new sequelize_2.Sequelize(this.database);
        }
        this.databaseLoaded = true;
    }
    setDatabaseInstance(sequelize) {
        this.sequelize = sequelize;
        this.databaseLoaded = true;
    }
    setSchema(schema) {
        this.schema = schema;
    }
    loadSchema(schema) {
        this.loadDatabaseInstance();
        if (schema === undefined) {
            schema = this.schema;
        }
        if (schema) {
            const schemaJson = typeof schema === 'string'
                ? JSON.parse(fs.readFileSync(schema, 'utf8'))
                : schema;
            this.resources = (0, sequelize_1.generateResourcesFromJSON)(schemaJson, this.sequelize);
            for (const key in this.resources) {
                const resource = this.resources[key];
                this.models[modelName(resource.name)] = resource.model;
            }
        }
        else {
            throw new Error('Schema not found');
        }
    }
    loadRoutes() {
        let shemasPaths = {};
        const resources = this.resources;
        const tags = this.tags;
        const handlers = this.handlers;
        const adminsData = {
            resources: {}
        };
        const createRoutes = new routes_1.CreateRoutes(this.api);
        for (const key in this.resources) {
            const resource = resources[key];
            const openapiSchemas = (0, openapi_1.generateOpenapiSchemas)(resource, tags);
            const paths = openapiSchemas.paths;
            const adminData = openapiSchemas['x-admin'];
            createRoutes.createRouteResource({
                paths,
                resource,
                handlers,
                adminData
            });
            adminsData.resources = {
                ...adminsData.resources,
                ...adminData.resources
            };
            shemasPaths = { ...shemasPaths, ...paths };
        }
        let paths = {};
        this.routes.forEach((route) => {
            createRoutes.createRoutes({ ...route });
            paths = { ...paths, ...(0, routes_1.routesToPaths)(route) };
        });
        const health = (0, health_1.default)(this.sequelize);
        createRoutes.createRoutes(health);
        const healthPaths = (0, routes_1.routesToPaths)(health);
        const docPaths = {
            ...shemasPaths,
            ...healthPaths,
            ...paths
        };
        const openapi = (0, openapi_2.default)({
            paths: docPaths,
            info: this.info,
            servers: this.servers,
            admin: adminsData
        });
        this.openapiSpec = openapi.spec;
        createRoutes.createRoutes(openapi.routes);
        createRoutes.api.setErrorHandler(function (error, request, reply) {
            reply.send(error);
        });
    }
    loadAll() {
        this.loadSchema();
        this.loadRoutes();
    }
    setDatabase(database) {
        this.database = { ...this.database, ...database };
        return this;
    }
    async connect() {
        await this.testDatabaseConnection();
        await this.createTables();
    }
    async createTables() {
        try {
            await this.sequelize?.sync(this.database.sync);
            log_1.default.info('All tables created.');
        }
        catch (error) {
            log_1.default.error('Error creating tables:', error);
            await this.sequelize?.close();
        }
    }
    async testDatabaseConnection() {
        if (this.sequelize) {
            await this.sequelize.authenticate();
        }
        else {
            throw new Error('Database connection not established');
        }
    }
    async start() {
        this.loadAll();
        await this.connect();
        await this.listen(this.listenConfig);
    }
    //Resources
    getResource(resourceName) {
        return this.resources[(0, makes_1.getResourceName)(resourceName)];
    }
    // Routes
    addRoutes(routes) {
        if (routes instanceof routes_1.RoutesBuilder || routes instanceof routes_1.PathBuilder) {
            routes = routes.build();
        }
        else if (typeof routes === 'function') {
            const builder = new routes(this);
            routes = builder.getRoutes();
        }
        this.routes.push(routes);
    }
    addHandlers(handlers) {
        if (typeof handlers === 'function') {
            const builder = new handlers(this);
            handlers = builder.getHandlers();
        }
        this.handlers = { ...this.handlers, ...handlers };
    }
    path(path, options) {
        this.addRoutes({
            [path]: options
        });
        return this;
    }
    get(path, options) {
        return this.path(path, {
            get: options
        });
    }
    post(path, options) {
        return this.path(path, {
            post: options
        });
    }
    put(path, options) {
        return this.path(path, {
            put: options
        });
    }
    delete(path, options) {
        return this.path(path, {
            delete: options
        });
    }
    patch(path, options) {
        return this.path(path, {
            patch: options
        });
    }
    // Events
    on(modelName, action, callback) {
        (0, events_1.on)(modelName, action, callback);
        return this;
    }
    emit(modelName, action, err, data) {
        (0, events_1.emit)(modelName, action, err, data);
        return this;
    }
    removeListener(modelName, action) {
        (0, events_1.remove)(modelName, action);
        return this;
    }
}
exports.FastAPI = FastAPI;
var routes_2 = require("./resources/routes");
Object.defineProperty(exports, "PathBuilder", { enumerable: true, get: function () { return routes_2.PathBuilder; } });
Object.defineProperty(exports, "RoutesBuilder", { enumerable: true, get: function () { return routes_2.RoutesBuilder; } });
var responses_1 = require("./resources/openapi/responses");
Object.defineProperty(exports, "makeResponses", { enumerable: true, get: function () { return responses_1.makeResponses; } });
var builder_1 = require("./resources/sequelize/builder");
Object.defineProperty(exports, "SchemaBuilder", { enumerable: true, get: function () { return builder_1.SchemaBuilder; } });
Object.defineProperty(exports, "AutoColumn", { enumerable: true, get: function () { return builder_1.AutoColumn; } });
Object.defineProperty(exports, "TableBuilder", { enumerable: true, get: function () { return builder_1.TableBuilder; } });
var sequelize_3 = require("./resources/sequelize");
Object.defineProperty(exports, "ColumnType", { enumerable: true, get: function () { return sequelize_3.ColumnType; } });
var sequelize_4 = require("sequelize");
Object.defineProperty(exports, "DataTypes", { enumerable: true, get: function () { return sequelize_4.DataTypes; } });
exports.Decorators = __importStar(require("./routes/makes"));
function modelName(text) {
    const name = text.charAt(0).toUpperCase();
    // se terminar com s, remove a ultima letra
    if (text[text.length - 1] === 's') {
        return name + text.slice(1, -1);
    }
    return name + text.slice(1);
}
exports.modelName = modelName;
