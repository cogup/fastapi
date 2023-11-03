import { Model } from 'index';
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
 * Register a callback function for a specific model and action.
 * @param model - The event key, which can be a string or the Model type.
 * @param action - The action associated with the event.
 * @param callback - The callback function to register.
 */
export declare function onAction<T>(model: EventKey, action: T, callback: EventCallback): void;
/**
 * Trigger callbacks for a specific model and action.
 * @param model - The event key, which can be a string or the Model type.
 * @param action - The action associated with the event.
 * @param err - An error object, if an error occurred.
 * @param data - The data to pass to the callbacks.
 */
export declare function emitAction<T>(model: EventKey, action: T, err: any, data?: any): void;
/**
 * Remove all callbacks for a specific model and action.
 * @param model - The event key, which can be a string or the Model type.
 * @param action - The action associated with the event.
 */
export declare function removeAction<T>(model: EventKey, action: T): void;
/**
 * Register a callback function for a general event.
 * @param event - The name of the general event.
 * @param callback - The callback function to register.
 */
export declare function on(event: string, callback: EventCallback): void;
/**
 * Trigger callbacks for a general event.
 * @param event - The name of the general event.
 * @param err - An error object, if an error occurred.
 * @param data - The data to pass to the callbacks.
 */
export declare function emit(event: string, err: any, data?: any): void;
/**
 * Remove all callbacks for a general event.
 * @param event - The name of the general event.
 */
export declare function remove(event: string): void;
/**
 * Remove all registered callbacks for all events.
 */
export declare function removeAll(): void;
/**
 * Get the entire events storage dictionary.
 * @returns The events storage dictionary.
 */
export declare function getEventsStorage(): EventsStorage;
/**
 * Get an array of all registered event names.
 * @returns An array of event names.
 */
export declare function getEvents(): string[];
/**
 * Get an array of callback functions for a specific event.
 * @param event - The name of the event to retrieve callbacks for.
 * @returns An array of callback functions for the specified event.
 */
export declare function getEventCallbacks(event: string): EventCallback[];
/**
 * Get the first callback function for a specific event.
 * @param event - The name of the event to retrieve the first callback for.
 * @returns The first callback function for the specified event, or undefined if none exists.
 */
export declare function getEventCallback(event: string): EventCallback | undefined;
