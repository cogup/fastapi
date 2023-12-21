// Import the Model type from the 'index' module.
import { Model } from '../index';

/**
 * Represents a callback function for events.
 * @param err - An error object, if an error occurred.
 * @param data - The data associated with the event.
 */
export interface EventCallback {
  (err: any, data: any): void;
}

/**
 * A dictionary to store event callbacks for different event keys.
 */
export interface EventsStorage {
  [key: string]: EventCallback[];
}

/**
 * A type for event keys, which can be a string or the Model type.
 */
export type EventKey = string | typeof Model;

/**
 * The dictionary to store registered event callbacks.
 */
const eventsStorage: EventsStorage = {};

/**
 * Resolves the event name based on the model and action.
 * @param model - The event key, which can be a string or the Model type.
 * @param action - The action associated with the event.
 * @returns The resolved event name.
 */
function resolveEventName<T>(model: EventKey, action: T): string {
  const name =
    typeof model === 'string' ? model : `model_${(model as typeof Model).name}`;

  return `action.${name}.${action}`;
}

/**
 * Register a callback function for a specific model and action.
 * @param model - The event key, which can be a string or the Model type.
 * @param action - The action associated with the event.
 * @param callback - The callback function to register.
 */
export function onAction<T>(
  model: EventKey,
  action: T,
  callback: EventCallback
): void {
  const event = resolveEventName(model, action);

  if (!eventsStorage[event]) {
    eventsStorage[event] = [];
  }

  eventsStorage[event].push(callback);
}

/**
 * Trigger callbacks for a specific model and action.
 * @param model - The event key, which can be a string or the Model type.
 * @param action - The action associated with the event.
 * @param err - An error object, if an error occurred.
 * @param data - The data to pass to the callbacks.
 */
export function emitAction<T>(
  model: EventKey,
  action: T,
  err: any,
  data?: any
): void {
  const event = resolveEventName(model, action);

  if (eventsStorage[event]) {
    eventsStorage[event].forEach((callback) => {
      callback(err, data);
    });
  }
}

/**
 * Remove all callbacks for a specific model and action.
 * @param model - The event key, which can be a string or the Model type.
 * @param action - The action associated with the event.
 */
export function removeAction<T>(model: EventKey, action: T): void {
  const event = resolveEventName(model, action);

  if (eventsStorage[event]) {
    delete eventsStorage[event];
  }
}

/**
 * Register a callback function for a general event.
 * @param event - The name of the general event.
 * @param callback - The callback function to register.
 */
export function on<T>(event: T, callback: EventCallback): void {
  const eventKey = `event.${event}`;

  if (!eventsStorage[eventKey]) {
    eventsStorage[eventKey] = [];
  }

  eventsStorage[eventKey].push(callback);
}

/**
 * Trigger callbacks for a general event.
 * @param event - The name of the general event.
 * @param err - An error object, if an error occurred.
 * @param data - The data to pass to the callbacks.
 */
export function emit(event: string, err: any, data?: any): void {
  const eventKey = `event.${event}`;

  if (eventsStorage[eventKey]) {
    eventsStorage[eventKey].forEach((callback) => {
      callback(err, data);
    });
  }
}

/**
 * Remove all callbacks for a general event.
 * @param event - The name of the general event.
 */
export function remove(event: string): void {
  if (eventsStorage[event]) {
    delete eventsStorage[event];
  }
}

/**
 * Remove all registered callbacks for all events.
 */
export function removeAll(): void {
  Object.keys(eventsStorage).forEach((event) => {
    delete eventsStorage[event];
  });
}

/**
 * Get the entire events storage dictionary.
 * @returns The events storage dictionary.
 */
export function getEventsStorage(): EventsStorage {
  return eventsStorage;
}

/**
 * Get an array of all registered event names.
 * @returns An array of event names.
 */
export function getEvents(): string[] {
  return Object.keys(eventsStorage);
}

/**
 * Get an array of callback functions for a specific event.
 * @param event - The name of the event to retrieve callbacks for.
 * @returns An array of callback functions for the specified event.
 */
export function getEventCallbacks(event: string): EventCallback[] {
  return eventsStorage[event];
}

/**
 * Get the first callback function for a specific event.
 * @param event - The name of the event to retrieve the first callback for.
 * @returns The first callback function for the specified event, or undefined if none exists.
 */
export function getEventCallback(event: string): EventCallback | undefined {
  return eventsStorage[event]?.[0];
}
