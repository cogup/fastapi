"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.emit = exports.on = void 0;
const eventsStorage = {};
function resolveEventName(model, action) {
    const name = typeof model === 'string' ? model : `model_${model.name}`;
    return `${name}.${action}`;
}
function on(model, action, callback) {
    const event = resolveEventName(model, action);
    if (!eventsStorage[event]) {
        eventsStorage[event] = [];
    }
    eventsStorage[event].push(callback);
}
exports.on = on;
function emit(model, action, err, data) {
    const event = resolveEventName(model, action);
    if (eventsStorage[event]) {
        eventsStorage[event].forEach((callback) => {
            callback(err, data);
        });
    }
}
exports.emit = emit;
function remove(model, action) {
    const event = resolveEventName(model, action);
    if (eventsStorage[event]) {
        delete eventsStorage[event];
    }
}
exports.remove = remove;
