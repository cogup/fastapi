"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Patch = exports.Delete = exports.Put = exports.Post = exports.Get = void 0;
const controllers_1 = require("../resources/controllers");
require("reflect-metadata");
function Get(route) {
    return innerRoutesDecorator(route, controllers_1.MethodType.GET);
}
exports.Get = Get;
function Post(route) {
    return innerRoutesDecorator(route, controllers_1.MethodType.POST);
}
exports.Post = Post;
function Put(route) {
    return innerRoutesDecorator(route, controllers_1.MethodType.PUT);
}
exports.Put = Put;
function Delete(route) {
    return innerRoutesDecorator(route, controllers_1.MethodType.DELETE);
}
exports.Delete = Delete;
function Patch(route) {
    return innerRoutesDecorator(route, controllers_1.MethodType.PATCH);
}
exports.Patch = Patch;
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
