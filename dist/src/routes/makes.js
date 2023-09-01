"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakeRouters = exports.Patch = exports.Delete = exports.Put = exports.Post = exports.Get = exports.MakeHandlers = exports.getPathByMethod = exports.Remove = exports.Update = exports.GetOne = exports.GetAll = exports.Create = exports.getResourceName = void 0;
const index_1 = require("../resources/openapi/index");
const routes_1 = require("../resources/routes");
require("reflect-metadata");
function getResourceName(resourceName) {
    if (typeof resourceName === 'string') {
        return resourceName;
    }
    return resourceName.name;
}
exports.getResourceName = getResourceName;
function innerHandlerDecorator(resourceName, HandlerMethodType) {
    return function (target, key, descriptor) {
        Reflect.defineMetadata('handler', {
            resourceName: getResourceName(resourceName),
            HandlerMethodType
        }, target, key);
        return descriptor;
    };
}
function Create(resourceName) {
    return innerHandlerDecorator(resourceName, routes_1.HandlerMethodType.CREATE);
}
exports.Create = Create;
function GetAll(resourceName) {
    return innerHandlerDecorator(resourceName, routes_1.HandlerMethodType.GET_ALL);
}
exports.GetAll = GetAll;
function GetOne(resourceName) {
    return innerHandlerDecorator(resourceName, routes_1.HandlerMethodType.GET_ONE);
}
exports.GetOne = GetOne;
function Update(resourceName) {
    return innerHandlerDecorator(resourceName, routes_1.HandlerMethodType.UPDATE);
}
exports.Update = Update;
function Remove(resourceName) {
    return innerHandlerDecorator(resourceName, routes_1.HandlerMethodType.REMOVE);
}
exports.Remove = Remove;
function getPathByMethod(resourceName, method) {
    const paths = (0, index_1.generatePaths)(resourceName);
    if (method === routes_1.HandlerMethodType.CREATE ||
        method === routes_1.HandlerMethodType.GET_ALL) {
        return paths.many;
    }
    return paths.single;
}
exports.getPathByMethod = getPathByMethod;
class MakeHandlers {
    onLoad(_fastapi) { }
    getHandlers() {
        const handlers = {};
        const controllerMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this));
        for (const methodName of controllerMethods) {
            const handler = Reflect.getMetadata('handler', this, methodName);
            // add handler to handlers
            if (handler) {
                const path = getPathByMethod(handler.resourceName, handler.HandlerMethodType);
                if (!handlers[handler.resourceName]) {
                    handlers[path] = {};
                }
                handlers[path][handler.HandlerMethodType] = this[methodName].bind(this);
            }
        }
        return handlers;
    }
}
exports.MakeHandlers = MakeHandlers;
function innerRoutesDecorator(route, methodType) {
    if (typeof route === 'string') {
        route = {
            path: route
        };
    }
    return function (target, key, descriptor) {
        Reflect.defineMetadata('routes', {
            route,
            methodType
        }, target, key);
        return descriptor;
    };
}
function Get(route) {
    return innerRoutesDecorator(route, routes_1.MethodType.GET);
}
exports.Get = Get;
function Post(route) {
    return innerRoutesDecorator(route, routes_1.MethodType.POST);
}
exports.Post = Post;
function Put(route) {
    return innerRoutesDecorator(route, routes_1.MethodType.PUT);
}
exports.Put = Put;
function Delete(route) {
    return innerRoutesDecorator(route, routes_1.MethodType.DELETE);
}
exports.Delete = Delete;
function Patch(route) {
    return innerRoutesDecorator(route, routes_1.MethodType.PATCH);
}
exports.Patch = Patch;
class MakeRouters {
    onLoad(_fastapi) { }
    getRoutes() {
        const routes = {};
        const controllerMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this));
        for (const methodName of controllerMethods) {
            const route = Reflect.getMetadata('routes', this, methodName);
            // add handler to handlers
            if (route) {
                if (!routes[route.route.path]) {
                    routes[route.route.path] = {};
                }
                const { path, ...rest } = route.route;
                routes[path][route.methodType] = {
                    ...rest,
                    handler: this[methodName].bind(this)
                };
            }
        }
        return routes;
    }
}
exports.MakeRouters = MakeRouters;
