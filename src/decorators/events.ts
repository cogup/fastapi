import 'reflect-metadata';
import { HandlerType } from '..';
import { EventKey } from '../resources/events';

export function OnCreate(event: EventKey) {
  return innerEventDecorator(event, HandlerType.CREATE);
}

export function OnGetAll(event: EventKey) {
  return innerEventDecorator(event, HandlerType.GET_ALL);
}

export function OnGetOne(event: EventKey) {
  return innerEventDecorator(event, HandlerType.GET_ONE);
}

export function OnUpdate(event: EventKey) {
  return innerEventDecorator(event, HandlerType.UPDATE);
}

export function OnRemove(event: EventKey) {
  return innerEventDecorator(event, HandlerType.REMOVE);
}

export interface CustomEventItem {
  eventKey: string;
}

export function OnEvent<T>(eventKey: T) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    try {
      const eventString = eventKey as string;
      Reflect.defineMetadata(
        'events',
        {
          eventKey: eventString
        },
        target,
        key
      );

      return descriptor;
    } catch {
      throw new Error('Event key must be a string');
    }
  };
}

export interface CustomActionItem {
  model: EventKey;
  action: HandlerType;
}

function innerEventDecorator(model: EventKey, action: HandlerType) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(
      'actions',
      {
        model,
        action
      },
      target,
      key
    );

    return descriptor;
  };
}
