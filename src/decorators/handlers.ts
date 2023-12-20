import { generatePaths } from '../resources/openapi/index';
import { HandlerMethodType, Handlers } from '../resources/routes';
import { TableBuilder } from '../resources/sequelize/builder';
import 'reflect-metadata';
import { FastAPI } from '..';
import { SequelizeModel } from '../resources/sequelize';

interface HandlerItem {
  resourceName: string;
  HandlerMethodType: HandlerMethodType;
}

function innerHandlerDecorator(
  handler: HandlerResourceTypes,
  HandlerMethodType: HandlerMethodType
) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(
      'handler',
      {
        resourceName: getResourceName(handler),
        HandlerMethodType
      },
      target,
      key
    );

    return descriptor;
  };
}

export type HandlerResourceTypes =
  | string
  | TableBuilder
  | typeof SequelizeModel;

export function getResourceName(resourceName: HandlerResourceTypes) {
  if (typeof resourceName === 'string') {
    return resourceName;
  }

  if (resourceName instanceof SequelizeModel) {
    return resourceName.name;
  }

  return resourceName.name;
}

export function Create(handler: HandlerResourceTypes) {
  return innerHandlerDecorator(handler, HandlerMethodType.CREATE);
}

export function GetAll(handler: HandlerResourceTypes) {
  return innerHandlerDecorator(handler, HandlerMethodType.GET_ALL);
}

export function GetOne(handler: HandlerResourceTypes) {
  return innerHandlerDecorator(handler, HandlerMethodType.GET_ONE);
}

export function Update(handler: HandlerResourceTypes) {
  return innerHandlerDecorator(handler, HandlerMethodType.UPDATE);
}

export function Remove(handler: HandlerResourceTypes) {
  return innerHandlerDecorator(handler, HandlerMethodType.REMOVE);
}

export function getPathByMethod(
  resourceName: string,
  method: HandlerMethodType
): string {
  const paths = generatePaths(resourceName);

  if (
    method === HandlerMethodType.CREATE ||
    method === HandlerMethodType.GET_ALL
  ) {
    return paths.many;
  }

  return paths.single;
}

export class MakeHandlers {
  [key: string]: any;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onLoad(fastAPI: FastAPI) {}

  getHandlers(): Handlers {
    const handlers: Handlers = {};
    const controllerMethods = Object.getOwnPropertyNames(
      Object.getPrototypeOf(this)
    );

    for (const methodName of controllerMethods) {
      const handler = Reflect.getMetadata(
        'handler',
        this,
        methodName
      ) as HandlerItem;

      // add handler to handlers
      if (handler) {
        const path = getPathByMethod(
          handler.resourceName,
          handler.HandlerMethodType
        );

        if (!handlers[handler.resourceName]) {
          handlers[path] = {};
        }

        handlers[path][handler.HandlerMethodType] = this[methodName].bind(this);
      }
    }

    return handlers;
  }
}
