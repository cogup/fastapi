"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.events = exports.MakeHandlers = exports.Remove = exports.Update = exports.GetOne = exports.GetAll = exports.Create = exports.MakeRouters = exports.Delete = exports.Patch = exports.Put = exports.Post = exports.Get = exports.HandlerType = exports.HandlerMethodType = exports.log = exports.Model = exports.Sequelize = exports.ResourceType = exports.SchemaModelsBuilder = exports.TableBuilder = exports.AutoColumn = exports.SchemaBuilder = exports.makeResponses = exports.RoutesBuilder = exports.PathBuilder = exports.FastAPI = exports.getAppVersion = void 0;
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
const handlers_1 = require("./decorators/handlers");
const routes_2 = require("./decorators/routes");
const fs_1 = __importDefault(require("fs"));
function getAppVersion() {
    try {
        const packageJson = fs_1.default.readFileSync(`${process.cwd()}/package.json`, 'utf8');
        const packageObject = JSON.parse(packageJson);
        return packageObject.version;
    }
    catch {
        return 'undefined';
    }
}
exports.getAppVersion = getAppVersion;
class FastAPI {
    info = {
        title: 'FastAPI',
        description: 'FastAPI',
        version: getAppVersion()
    };
    servers = [];
    listenConfig = {
        port: 3000,
        host: '0.0.0.0'
    };
    rawRoutes = [];
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
    cors = {
        origin: '*'
    };
    forceCreateTables = false;
    api;
    listenFn;
    sequelize;
    openAPISpec;
    afterLoad = [];
    autoLoadSchema = true;
    autoLoadRoutes = true;
    constructor(props) {
        if (props) {
            if (props.schema !== undefined) {
                this.schema = props.schema;
            }
            if (props.handlers !== undefined) {
                this.handlers = props.handlers;
            }
            if (props.tags !== undefined) {
                this.tags = props.tags;
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
            if (props.autoLoadSchema !== undefined) {
                this.autoLoadSchema = props.autoLoadSchema;
            }
            if (props.autoLoadRoutes !== undefined) {
                this.autoLoadSchema = props.autoLoadRoutes;
            }
            if (props.routes !== undefined) {
                this.rawRoutes = props.routes;
            }
        }
        this.api = (0, serve_1.default)();
        this.listenFn = (0, util_1.promisify)(this.api.listen.bind(this.api));
        if (this.autoLoadSchema && this.schema !== undefined) {
            this.loadSchema();
            if (this.autoLoadRoutes) {
                this.loadRawRoutes();
                this.loadRoutes();
            }
        }
        return this;
    }
    setSequelize(sequelize) {
        this.sequelize = sequelize;
    }
    setSchema(schema) {
        this.schema = schema;
    }
    loadRawRoutes() {
        for (const route of this.rawRoutes) {
            this.addRoutes(route);
        }
    }
    loadSchema(schema) {
        if (schema === undefined) {
            schema = this.schema;
        }
        else {
            this.schema = schema;
        }
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
        let schemasPaths = {};
        const resources = this.resources;
        const tags = this.tags;
        const handlers = this.handlers;
        const adminsData = {
            resources: {}
        };
        const createRoutes = new routes_1.CreateRoutes(this.api);
        for (const key in this.resources) {
            const resource = resources[key];
            const openapiSchemas = (0, openapi_1.generateOpenAPISchemas)(resource, tags);
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
            schemasPaths = { ...schemasPaths, ...paths };
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
            ...schemasPaths,
            ...healthPaths,
            ...paths
        };
        const openapi = (0, openapi_2.default)({
            paths: docPaths,
            info: this.info,
            servers: this.servers,
            admin: adminsData
        });
        this.openAPISpec = openapi.spec;
        createRoutes.createRoutes(openapi.routes);
        createRoutes.api.setErrorHandler(function (error, request, reply) {
            reply.send(error);
        });
    }
    afterLoadExecute() {
        if (this.afterLoad) {
            this.afterLoad.forEach((builder) => {
                builder.onLoad(this);
            });
        }
    }
    async listen() {
        await this.listenFn(this.listenConfig);
        this.afterLoadExecute();
    }
    getResource(resourceName) {
        return this.resources[(0, handlers_1.getResourceName)(resourceName)];
    }
    addRoutes(routes) {
        if (routes instanceof routes_1.RoutesBuilder || routes instanceof routes_1.PathBuilder) {
            routes = routes.build();
        }
        else if (routes instanceof routes_2.MakeRouters) {
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
        if (handlers instanceof handlers_1.MakeHandlers) {
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
    getOpenAPISpec() {
        if (!this.openAPISpec) {
            throw new Error('OpenAPI spec not found');
        }
        return this.openAPISpec;
    }
}
exports.FastAPI = FastAPI;
var routes_3 = require("./resources/routes");
Object.defineProperty(exports, "PathBuilder", { enumerable: true, get: function () { return routes_3.PathBuilder; } });
Object.defineProperty(exports, "RoutesBuilder", { enumerable: true, get: function () { return routes_3.RoutesBuilder; } });
var responses_1 = require("./resources/openapi/responses");
Object.defineProperty(exports, "makeResponses", { enumerable: true, get: function () { return responses_1.makeResponses; } });
var builder_2 = require("./resources/sequelize/builder");
Object.defineProperty(exports, "SchemaBuilder", { enumerable: true, get: function () { return builder_2.SchemaBuilder; } });
Object.defineProperty(exports, "AutoColumn", { enumerable: true, get: function () { return builder_2.AutoColumn; } });
Object.defineProperty(exports, "TableBuilder", { enumerable: true, get: function () { return builder_2.TableBuilder; } });
Object.defineProperty(exports, "SchemaModelsBuilder", { enumerable: true, get: function () { return builder_2.SchemaModelsBuilder; } });
var sequelize_3 = require("./resources/sequelize");
Object.defineProperty(exports, "ResourceType", { enumerable: true, get: function () { return sequelize_3.ResourceType; } });
var routes_4 = require("./resources/routes/routes");
Object.defineProperty(exports, "HandlerType", { enumerable: true, get: function () { return routes_4.HandlerType; } });
var routes_5 = require("./decorators/routes");
Object.defineProperty(exports, "Get", { enumerable: true, get: function () { return routes_5.Get; } });
Object.defineProperty(exports, "Post", { enumerable: true, get: function () { return routes_5.Post; } });
Object.defineProperty(exports, "Put", { enumerable: true, get: function () { return routes_5.Put; } });
Object.defineProperty(exports, "Patch", { enumerable: true, get: function () { return routes_5.Patch; } });
Object.defineProperty(exports, "Delete", { enumerable: true, get: function () { return routes_5.Delete; } });
Object.defineProperty(exports, "MakeRouters", { enumerable: true, get: function () { return routes_5.MakeRouters; } });
var handlers_2 = require("./decorators/handlers");
Object.defineProperty(exports, "Create", { enumerable: true, get: function () { return handlers_2.Create; } });
Object.defineProperty(exports, "GetAll", { enumerable: true, get: function () { return handlers_2.GetAll; } });
Object.defineProperty(exports, "GetOne", { enumerable: true, get: function () { return handlers_2.GetOne; } });
Object.defineProperty(exports, "Update", { enumerable: true, get: function () { return handlers_2.Update; } });
Object.defineProperty(exports, "Remove", { enumerable: true, get: function () { return handlers_2.Remove; } });
Object.defineProperty(exports, "MakeHandlers", { enumerable: true, get: function () { return handlers_2.MakeHandlers; } });
exports.events = {
    on: events_1.on,
    emit: events_1.emit,
    remove: events_1.remove
};
