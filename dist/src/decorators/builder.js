"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Builder = void 0;
require("reflect-metadata");
const events_1 = require("../resources/events");
const handlers_1 = require("./handlers");
class Builder {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onLoad(fastAPI) { }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    preLoad(fastAPI) { }
    loadEvents() {
        const controllerMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this));
        for (const methodName of controllerMethods) {
            const actions = Reflect.getMetadata('actions', this, methodName);
            if (actions) {
                (0, events_1.onAction)(actions.model, actions.action, this[methodName].bind(this));
            }
            const events = Reflect.getMetadata('events', this, methodName);
            if (events) {
                (0, events_1.on)(events.eventKey, this[methodName].bind(this));
            }
        }
    }
    loadHandlers(prefix) {
        const handlers = {};
        const controllerMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this));
        for (const methodName of controllerMethods) {
            const handler = Reflect.getMetadata('handler', this, methodName);
            // add handler to handlers
            if (handler) {
                const path = (0, handlers_1.getPathByMethod)(handler.resourceName, handler.HandlerMethodType, prefix);
                if (!handlers[handler.resourceName]) {
                    handlers[path] = {};
                }
                handlers[path][handler.HandlerMethodType] = this[methodName].bind(this);
            }
        }
        return handlers;
    }
    loadRoutes(defaultPrefix) {
        const controllers = {};
        const controllerMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this));
        for (const methodName of controllerMethods) {
            const route = Reflect.getMetadata('routes', this, methodName);
            if (route) {
                const { path, prefix, ...rest } = route.route;
                const fixPath = `${prefix ?? defaultPrefix}${path}`;
                if (!controllers[fixPath]) {
                    controllers[fixPath] = {};
                }
                controllers[fixPath][route.methodType] = {
                    ...rest,
                    handler: this[methodName].bind(this)
                };
            }
        }
        return controllers;
    }
}
exports.Builder = Builder;
