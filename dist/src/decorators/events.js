"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnEvent = exports.OnRemove = exports.OnUpdate = exports.OnGetOne = exports.OnGetAll = exports.OnCreate = void 0;
require("reflect-metadata");
const __1 = require("..");
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
function OnEvent(eventKey) {
    return function (target, key, descriptor) {
        try {
            const eventString = eventKey;
            Reflect.defineMetadata('events', {
                eventKey: eventString
            }, target, key);
            return descriptor;
        }
        catch {
            throw new Error('Event key must be a string');
        }
    };
}
exports.OnEvent = OnEvent;
function innerEventDecorator(model, action) {
    return function (target, key, descriptor) {
        Reflect.defineMetadata('actions', {
            model,
            action
        }, target, key);
        return descriptor;
    };
}
