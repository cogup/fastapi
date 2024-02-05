"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventCallback = exports.getEventCallbacks = exports.getEvents = exports.getEventsStorage = exports.removeAll = exports.remove = exports.emit = exports.on = exports.removeAction = exports.emitAction = exports.onAction = void 0;
/**
 * The dictionary to store registered event callbacks.
 */
const eventsStorage = {};
/**
 * Resolves the event name based on the model and action.
 * @param model - The event key, which can be a string or the Model type.
 * @param action - The action associated with the event.
 * @returns The resolved event name.
 */
function resolveEventName(model, action) {
    const name = typeof model === 'string' ? model : `model_${model.name}`;
    return `action.${name}.${action}`;
}
/**
 * Register a callback function for a specific model and action.
 * @param model - The event key, which can be a string or the Model type.
 * @param action - The action associated with the event.
 * @param callback - The callback function to register.
 */
function onAction(model, action, callback) {
    const event = resolveEventName(model, action);
    if (!eventsStorage[event]) {
        eventsStorage[event] = [];
    }
    eventsStorage[event].push(callback);
}
exports.onAction = onAction;
/**
 * Trigger callbacks for a specific model and action.
 * @param model - The event key, which can be a string or the Model type.
 * @param action - The action associated with the event.
 * @param err - An error object, if an error occurred.
 * @param data - The data to pass to the callbacks.
 */
function emitAction(model, action, err, data) {
    const event = resolveEventName(model, action);
    if (eventsStorage[event]) {
        eventsStorage[event].forEach((callback) => {
            callback(err, data);
        });
    }
}
exports.emitAction = emitAction;
/**
 * Remove all callbacks for a specific model and action.
 * @param model - The event key, which can be a string or the Model type.
 * @param action - The action associated with the event.
 */
function removeAction(model, action) {
    const event = resolveEventName(model, action);
    if (eventsStorage[event]) {
        delete eventsStorage[event];
    }
}
exports.removeAction = removeAction;
/**
 * Register a callback function for a general event.
 * @param event - The name of the general event.
 * @param callback - The callback function to register.
 */
function on(event, callback) {
    const eventKey = `event.${event}`;
    if (!eventsStorage[eventKey]) {
        eventsStorage[eventKey] = [];
    }
    eventsStorage[eventKey].push(callback);
}
exports.on = on;
/**
 * Trigger callbacks for a general event.
 * @param event - The name of the general event.
 * @param err - An error object, if an error occurred.
 * @param data - The data to pass to the callbacks.
 */
function emit(event, err, data) {
    const eventKey = `event.${event}`;
    if (eventsStorage[eventKey]) {
        eventsStorage[eventKey].forEach((callback) => {
            callback(err, data);
        });
    }
}
exports.emit = emit;
/**
 * Remove all callbacks for a general event.
 * @param event - The name of the general event.
 */
function remove(event) {
    if (eventsStorage[event]) {
        delete eventsStorage[event];
    }
}
exports.remove = remove;
/**
 * Remove all registered callbacks for all events.
 */
function removeAll() {
    Object.keys(eventsStorage).forEach((event) => {
        delete eventsStorage[event];
    });
}
exports.removeAll = removeAll;
/**
 * Get the entire events storage dictionary.
 * @returns The events storage dictionary.
 */
function getEventsStorage() {
    return eventsStorage;
}
exports.getEventsStorage = getEventsStorage;
/**
 * Get an array of all registered event names.
 * @returns An array of event names.
 */
function getEvents() {
    return Object.keys(eventsStorage);
}
exports.getEvents = getEvents;
/**
 * Get an array of callback functions for a specific event.
 * @param event - The name of the event to retrieve callbacks for.
 * @returns An array of callback functions for the specified event.
 */
function getEventCallbacks(event) {
    return eventsStorage[event];
}
exports.getEventCallbacks = getEventCallbacks;
/**
 * Get the first callback function for a specific event.
 * @param event - The name of the event to retrieve the first callback for.
 * @returns The first callback function for the specified event, or undefined if none exists.
 */
function getEventCallback(event) {
    return eventsStorage[event]?.[0];
}
exports.getEventCallback = getEventCallback;
