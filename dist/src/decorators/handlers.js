"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPathByMethod = exports.Remove = exports.Update = exports.GetOne = exports.GetAll = exports.Create = exports.getResourceName = void 0;
const index_1 = require("../resources/openapi/index");
const routes_1 = require("../resources/routes");
require("reflect-metadata");
const sequelize_1 = require("../resources/sequelize");
function getResourceName(resourceName) {
    if (typeof resourceName === 'string') {
        return resourceName;
    }
    if (resourceName instanceof sequelize_1.SequelizeModel) {
        return resourceName.name;
    }
    return resourceName.name;
}
exports.getResourceName = getResourceName;
function Create(handler) {
    return innerHandlerDecorator(handler, routes_1.HandlerMethodType.CREATE);
}
exports.Create = Create;
function GetAll(handler) {
    return innerHandlerDecorator(handler, routes_1.HandlerMethodType.GET_ALL);
}
exports.GetAll = GetAll;
function GetOne(handler) {
    return innerHandlerDecorator(handler, routes_1.HandlerMethodType.GET_ONE);
}
exports.GetOne = GetOne;
function Update(handler) {
    return innerHandlerDecorator(handler, routes_1.HandlerMethodType.UPDATE);
}
exports.Update = Update;
function Remove(handler) {
    return innerHandlerDecorator(handler, routes_1.HandlerMethodType.REMOVE);
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
function innerHandlerDecorator(handler, HandlerMethodType) {
    return function (target, key, descriptor) {
        Reflect.defineMetadata('handler', {
            resourceName: getResourceName(handler),
            HandlerMethodType
        }, target, key);
        return descriptor;
    };
}
