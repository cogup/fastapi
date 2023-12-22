"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inject = exports.events = exports.Builder = exports.OnEvent = exports.OnRemove = exports.OnUpdate = exports.OnGetOne = exports.OnGetAll = exports.OnCreate = exports.Remove = exports.Update = exports.GetOne = exports.GetAll = exports.Create = exports.Delete = exports.Patch = exports.Put = exports.Post = exports.Get = exports.HandlerType = exports.HandlerMethodType = exports.Model = exports.Sequelize = exports.DataTypes = exports.ResourceType = exports.SchemaModelsBuilder = exports.TableBuilder = exports.AutoColumn = exports.SchemaBuilder = exports.makeResponses = exports.RoutesBuilder = exports.PathBuilder = exports.FastAPI = exports.getAppVersion = void 0;
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
const openapi_2 = __importDefault(require("./routes/openapi"));
const builder_1 = require("./resources/sequelize/builder");
const handlers_1 = require("./decorators/handlers");
const fs_1 = __importDefault(require("fs"));
const builder_2 = require("./decorators/builder");
const inject_1 = require("./decorators/inject");
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
    rawHandlers = [];
    rawEvents = [];
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
    autoLoadHandlers = true;
    autoLoadEvents = true;
    constructor(props) {
        if (props) {
            if (props.schema !== undefined) {
                this.schema = props.schema;
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
                this.autoLoadRoutes = props.autoLoadRoutes;
            }
            if (props.autoLoadHandlers !== undefined) {
                this.autoLoadHandlers = props.autoLoadHandlers;
            }
            if (props.autoLoadEvents !== undefined) {
                this.autoLoadEvents = props.autoLoadEvents;
            }
            if (props.routes !== undefined) {
                this.rawRoutes = props.routes;
            }
            if (props.handlers !== undefined) {
                this.rawHandlers = props.handlers;
            }
            if (props.events !== undefined) {
                this.rawEvents = props.events;
            }
            if (props.builders) {
                this.rawEvents.push(...props.builders);
                this.rawHandlers.push(...props.builders);
                this.rawRoutes.push(...props.builders);
            }
        }
        this.api = (0, serve_1.default)();
        this.listenFn = (0, util_1.promisify)(this.api.listen.bind(this.api));
        const builderClasses = (0, inject_1.loadBuilderClasses)();
        this.rawEvents.push(...builderClasses);
        this.rawHandlers.push(...builderClasses);
        this.rawRoutes.push(...builderClasses);
        if (this.autoLoadSchema && this.schema !== undefined) {
            this.loadSchema();
            if (this.autoLoadHandlers) {
                this.loadRawHandlers();
            }
        }
        if (this.autoLoadEvents) {
            this.loadRawEvents();
        }
        if (this.autoLoadRoutes) {
            this.loadRawRoutes();
            this.loadRoutes();
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
    loadRawHandlers() {
        for (const handlers of this.rawHandlers) {
            this.addHandlers(handlers);
        }
    }
    loadRawEvents() {
        for (const events of this.rawEvents) {
            this.addEvents(events);
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
        this.afterLoadExecute();
    }
    afterLoadExecute() {
        if (this.afterLoad) {
            this.afterLoad.forEach((builder) => {
                builder.onLoad(this);
                builder.loadEvents();
            });
        }
    }
    async listen() {
        await this.listenFn(this.listenConfig);
    }
    getResource(resourceName) {
        return this.resources[(0, handlers_1.getResourceName)(resourceName)];
    }
    addRoutes(routes) {
        if (routes instanceof routes_1.RoutesBuilder || routes instanceof routes_1.PathBuilder) {
            this.routes.push(routes.build());
        }
        else if (routes instanceof builder_2.Builder) {
            this.routes.push(routes.loadRoutes());
            this.afterLoad?.push(routes);
        }
        else if (routes instanceof inject_1.BuilderInject) {
            this.routes.push(routes.builder.loadRoutes());
            this.afterLoad?.push(routes.builder);
        }
        else if (typeof routes === 'function') {
            const builder = new routes();
            this.routes.push(builder.loadRoutes());
            this.afterLoad?.push(builder);
        }
        else {
            this.routes.push(routes);
        }
    }
    addHandlers(handlers) {
        if (handlers instanceof builder_2.Builder) {
            this.handlers = { ...this.handlers, ...handlers.loadHandlers() };
            this.afterLoad?.push(handlers);
        }
        else if (handlers instanceof inject_1.BuilderInject) {
            this.handlers = { ...this.handlers, ...handlers.builder.loadHandlers() };
            this.afterLoad?.push(handlers.builder);
        }
        else if (typeof handlers === 'function') {
            const builder = new handlers();
            this.handlers = { ...this.handlers, ...builder.loadHandlers() };
            this.afterLoad?.push(builder);
        }
    }
    addEvents(events) {
        if (events instanceof builder_2.Builder) {
            this.afterLoad?.push(events);
        }
        else if (events instanceof inject_1.BuilderInject) {
            this.afterLoad?.push(events.builder);
        }
        else if (typeof events === 'function') {
            const builder = new events();
            this.afterLoad?.push(builder);
        }
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
        (0, events_1.onAction)(modelName, action, callback);
        return this;
    }
    emit(modelName, action, err, data) {
        (0, events_1.emitAction)(modelName, action, err, data);
        return this;
    }
    removeListener(modelName, action) {
        (0, events_1.removeAction)(modelName, action);
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
var routes_2 = require("./resources/routes");
Object.defineProperty(exports, "PathBuilder", { enumerable: true, get: function () { return routes_2.PathBuilder; } });
Object.defineProperty(exports, "RoutesBuilder", { enumerable: true, get: function () { return routes_2.RoutesBuilder; } });
var responses_1 = require("./resources/openapi/responses");
Object.defineProperty(exports, "makeResponses", { enumerable: true, get: function () { return responses_1.makeResponses; } });
var builder_3 = require("./resources/sequelize/builder");
Object.defineProperty(exports, "SchemaBuilder", { enumerable: true, get: function () { return builder_3.SchemaBuilder; } });
Object.defineProperty(exports, "AutoColumn", { enumerable: true, get: function () { return builder_3.AutoColumn; } });
Object.defineProperty(exports, "TableBuilder", { enumerable: true, get: function () { return builder_3.TableBuilder; } });
Object.defineProperty(exports, "SchemaModelsBuilder", { enumerable: true, get: function () { return builder_3.SchemaModelsBuilder; } });
var sequelize_3 = require("./resources/sequelize");
Object.defineProperty(exports, "ResourceType", { enumerable: true, get: function () { return sequelize_3.ResourceType; } });
var sequelize_4 = require("sequelize");
Object.defineProperty(exports, "DataTypes", { enumerable: true, get: function () { return sequelize_4.DataTypes; } });
var routes_3 = require("./resources/routes/routes");
Object.defineProperty(exports, "HandlerType", { enumerable: true, get: function () { return routes_3.HandlerType; } });
var routes_4 = require("./decorators/routes");
Object.defineProperty(exports, "Get", { enumerable: true, get: function () { return routes_4.Get; } });
Object.defineProperty(exports, "Post", { enumerable: true, get: function () { return routes_4.Post; } });
Object.defineProperty(exports, "Put", { enumerable: true, get: function () { return routes_4.Put; } });
Object.defineProperty(exports, "Patch", { enumerable: true, get: function () { return routes_4.Patch; } });
Object.defineProperty(exports, "Delete", { enumerable: true, get: function () { return routes_4.Delete; } });
var handlers_2 = require("./decorators/handlers");
Object.defineProperty(exports, "Create", { enumerable: true, get: function () { return handlers_2.Create; } });
Object.defineProperty(exports, "GetAll", { enumerable: true, get: function () { return handlers_2.GetAll; } });
Object.defineProperty(exports, "GetOne", { enumerable: true, get: function () { return handlers_2.GetOne; } });
Object.defineProperty(exports, "Update", { enumerable: true, get: function () { return handlers_2.Update; } });
Object.defineProperty(exports, "Remove", { enumerable: true, get: function () { return handlers_2.Remove; } });
var events_2 = require("./decorators/events");
Object.defineProperty(exports, "OnCreate", { enumerable: true, get: function () { return events_2.OnCreate; } });
Object.defineProperty(exports, "OnGetAll", { enumerable: true, get: function () { return events_2.OnGetAll; } });
Object.defineProperty(exports, "OnGetOne", { enumerable: true, get: function () { return events_2.OnGetOne; } });
Object.defineProperty(exports, "OnUpdate", { enumerable: true, get: function () { return events_2.OnUpdate; } });
Object.defineProperty(exports, "OnRemove", { enumerable: true, get: function () { return events_2.OnRemove; } });
Object.defineProperty(exports, "OnEvent", { enumerable: true, get: function () { return events_2.OnEvent; } });
var builder_4 = require("./decorators/builder");
Object.defineProperty(exports, "Builder", { enumerable: true, get: function () { return builder_4.Builder; } });
exports.events = {
    on: events_1.on,
    emit: events_1.emit,
    remove: events_1.remove,
    onAction: events_1.onAction,
    emitAction: events_1.emitAction,
    removeAction: events_1.removeAction
};
var inject_2 = require("./decorators/inject");
Object.defineProperty(exports, "inject", { enumerable: true, get: function () { return inject_2.inject; } });
