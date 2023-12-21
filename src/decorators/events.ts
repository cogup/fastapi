import { TableBuilder } from '../resources/sequelize/builder';
import 'reflect-metadata';
import { HandlerType } from '..';
import { SequelizeModel } from '../resources/sequelize';
import { EventKey } from '../resources/events';

export interface CustomEventItem {
  model: EventKey;
  action: string;
}

function innerEventDecorator<T>(model: EventKey, action: T) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(
      'events',
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

export type EventResourceTypes = string | TableBuilder | typeof SequelizeModel;

export function getResourceName(resourceName: EventResourceTypes) {
  if (typeof resourceName === 'string') {
    return resourceName;
  }

  if (resourceName instanceof SequelizeModel) {
    return resourceName.name;
  }

  return resourceName.name;
}

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

export function OnEvent<T>(model: EventKey, action: T) {
  return innerEventDecorator(model, action);
}
