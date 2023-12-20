"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakeEvents = exports.OnEvent = exports.OnRemove = exports.OnUpdate = exports.OnGetOne = exports.OnGetAll = exports.OnCreate = exports.getResourceName = void 0;
require("reflect-metadata");
const __1 = require("..");
const sequelize_1 = require("../resources/sequelize");
const events_1 = require("../resources/events");
function innerEventDecorator(model, action) {
    return function (target, key, descriptor) {
        Reflect.defineMetadata('events', {
            model,
            action
        }, target, key);
        return descriptor;
    };
}
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
function OnCreate(event) {
    return innerEventDecorator(event, __1.HandlerType.CREATE);
}
exports.OnCreate = OnCreate;
function OnGetAll(event) {
    return innerEventDecorator(event, __1.HandlerType.GET_ALL);
}
exports.OnGetAll = OnGetAll;
function OnGetOne(event) {
    return innerEventDecorator(event, __1.HandlerType.GET_ONE);
}
exports.OnGetOne = OnGetOne;
function OnUpdate(event) {
    return innerEventDecorator(event, __1.HandlerType.UPDATE);
}
exports.OnUpdate = OnUpdate;
function OnRemove(event) {
    return innerEventDecorator(event, __1.HandlerType.REMOVE);
}
exports.OnRemove = OnRemove;
function OnEvent(model, action) {
    return innerEventDecorator(model, action);
}
exports.OnEvent = OnEvent;
class MakeEvents {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onLoad(fastAPI) { }
    loadEvents() {
        const controllerMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this));
        for (const methodName of controllerMethods) {
            const events = Reflect.getMetadata('events', this, methodName);
            if (events) {
                (0, events_1.onAction)(events.model, events.action, this[methodName].bind(this));
            }
        }
    }
}
exports.MakeEvents = MakeEvents;
