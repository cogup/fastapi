import { Model } from 'src';
import { convertToPlural } from './openapi/utils';

export interface EventCallback {
  (err: any, data: any): void;
}

export interface EventsStorage {
  [key: string]: EventCallback[];
}

export type EventKey = string | typeof Model;

const eventsStorage: EventsStorage = {};

function resolveEventName<T>(model: EventKey, action: T): string {
  const name =
    typeof model === 'string' ? model : `model_${(model as typeof Model).name}`;

  return `${name}.${action}`;
}

export function on<T>(model: EventKey, action: T, callback: EventCallback): void {
  const event = resolveEventName(model, action);

  if (!eventsStorage[event]) {
    eventsStorage[event] = [];
  }

  eventsStorage[event].push(callback);
}

export function emit<T>(model: EventKey, action: T, err: any, data?: any): void {
  const event = resolveEventName(model, action);

  if (eventsStorage[event]) {
    eventsStorage[event].forEach((callback) => {
      callback(err, data);
    });
  }
}

export function remove<T>(model: EventKey, action: T): void {
  const event = resolveEventName(model, action);

  if (eventsStorage[event]) {
    delete eventsStorage[event];
  }
}
