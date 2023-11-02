"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakeRouters = exports.Patch = exports.Delete = exports.Put = exports.Post = exports.Get = void 0;
const routes_1 = require("../resources/routes");
require("reflect-metadata");
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
    onLoad(_fastAPI) { }
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
