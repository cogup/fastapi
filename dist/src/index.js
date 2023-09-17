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
exports.Decorators = exports.DataTypes = exports.HandlerMethodType = exports.log = exports.Model = exports.Sequelize = exports.ResourceType = exports.SchemaModelsBuilder = exports.TableBuilder = exports.AutoColumn = exports.SchemaBuilder = exports.makeResponses = exports.RoutesBuilder = exports.PathBuilder = exports.FastAPI = void 0;
const serve_1 = __importDefault(require("./middle/serve"));
const openapi_1 = require("./resources/openapi");
const routes_1 = require("./resources/routes");
Object.defineProperty(exports, "HandlerMethodType", { enumerable: true, get: function () { return routes_1.HandlerMethodType; } });
const sequelize_1 = require("./resources/sequelize");
Object.defineProperty(exports, "Model", { enumerable: true, get: function () { return sequelize_1.SequelizeModel; } });
const health_1 = __importDefault(require("./routes/health"));
const events_1 = require("./resources/events");
const sequelize_2 = require("sequelize");
Object.defineProperty(exports, "Sequelize", { enumerable: true, get: function () { return sequelize_2.Sequelize; } });
const util_1 = require("util");
const log_1 = __importDefault(require("./resources/log"));
exports.log = log_1.default;
const openapi_2 = __importDefault(require("./routes/openapi"));
const builder_1 = require("./resources/sequelize/builder");
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
        create: ['Creates'],
        read: ['Reads'],
        update: ['Updates'],
        delete: ['Deletes'],
        list: ['Lists']
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
    listenFn;
    sequelize;
    openapiSpec;
    afterLoad = [];
    loadedResources;
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
            if (props.servers !== undefined) {
                this.servers = props.servers;
            }
            else {
                this.servers = [
                    {
                        url: `http://localhost:${this.listenConfig.port}`,
                        description: 'Local server'
                    }
                ];
            }
            if (props.sequelize !== undefined) {
                this.sequelize = props.sequelize;
            }
        }
        this.api = (0, serve_1.default)();
        this.listenFn = (0, util_1.promisify)(this.api.listen.bind(this.api));
        this.loadedResources = {
            schemas: false,
            routes: false,
            database: this.sequelize !== undefined,
            api: false
        };
        return this;
    }
    loadDatabaseInstance() {
        if (this.loadedResources.database)
            return;
        const { uri, ...database } = this.database;
        if (uri) {
            this.sequelize = new sequelize_2.Sequelize(uri, database);
        }
        else {
            this.sequelize = new sequelize_2.Sequelize(this.database);
        }
        this.loadedResources.database = true;
    }
    setDatabaseInstance(sequelize) {
        this.sequelize = sequelize;
        this.loadedResources.database = true;
    }
    setSchema(schema) {
        this.schema = schema;
    }
    loadSchema(schema) {
        if (this.loadedResources.schemas)
            return;
        this.loadDatabaseInstance();
        if (schema === undefined) {
            schema = this.schema;
        }
        else {
            this.schema = schema;
        }
        // schame is SchemaModelsBuilder
        // schema is Schema interface
        if (schema instanceof Array || schema instanceof builder_1.SchemaModelsBuilder) {
            const resources = (0, sequelize_1.generateResourcesFromSequelizeModels)(schema);
            this.resources = resources;
            for (const key in resources) {
                const resource = resources[key];
                const modelName = resource.model.name.charAt(0).toUpperCase() +
                    resource.model.name.slice(1);
                this.models[modelName] = resource.model;
            }
        }
        else if (schema instanceof Object) {
            const schemaJson = schema;
            this.resources = (0, sequelize_1.generateResourcesFromJSON)(schemaJson, this.sequelize);
            for (const key in this.resources) {
                const resource = this.resources[key];
                const modelName = resource.model.name.charAt(0).toUpperCase() +
                    resource.model.name.slice(1);
                this.models[modelName] = resource.model;
            }
        }
        else {
            throw new Error('Schema not found');
        }
    }
    loadRoutes() {
        if (this.loadedResources.routes)
            return;
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
    loadResources() {
        this.loadSchema();
        this.loadRoutes();
    }
    setDatabase(database) {
        this.database = { ...this.database, ...database };
        return this;
    }
    async dbConnect() {
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
    afterLoadExecute() {
        if (this.afterLoad) {
            this.afterLoad.forEach((builder) => {
                builder.onLoad(this);
            });
        }
    }
    async listen() {
        if (this.loadedResources.api)
            return;
        await this.listenFn(this.listenConfig);
        this.afterLoadExecute();
    }
    async start() {
        this.loadResources();
        await this.dbConnect();
        await this.listen();
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
        else if (routes instanceof makes_1.MakeRouters) {
            routes = routes.getRoutes();
        }
        else if (typeof routes === 'function') {
            const builder = new routes();
            routes = builder.getRoutes();
            this.afterLoad?.push(builder);
        }
        this.routes.push(routes);
    }
    addHandlers(handlers) {
        if (handlers instanceof makes_1.MakeHandlers) {
            handlers = handlers.getHandlers();
        }
        else if (typeof handlers === 'function') {
            const builder = new handlers();
            handlers = builder.getHandlers();
            this.afterLoad?.push(builder);
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
var builder_2 = require("./resources/sequelize/builder");
Object.defineProperty(exports, "SchemaBuilder", { enumerable: true, get: function () { return builder_2.SchemaBuilder; } });
Object.defineProperty(exports, "AutoColumn", { enumerable: true, get: function () { return builder_2.AutoColumn; } });
Object.defineProperty(exports, "TableBuilder", { enumerable: true, get: function () { return builder_2.TableBuilder; } });
Object.defineProperty(exports, "SchemaModelsBuilder", { enumerable: true, get: function () { return builder_2.SchemaModelsBuilder; } });
var sequelize_3 = require("./resources/sequelize");
Object.defineProperty(exports, "ResourceType", { enumerable: true, get: function () { return sequelize_3.ResourceType; } });
var sequelize_4 = require("sequelize");
Object.defineProperty(exports, "DataTypes", { enumerable: true, get: function () { return sequelize_4.DataTypes; } });
exports.Decorators = __importStar(require("./routes/makes"));
