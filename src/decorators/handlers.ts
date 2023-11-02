import { generatePaths } from '../resources/openapi/index';
import { HandlerMethodType, Handlers } from '../resources/routes';
import { TableBuilder } from '../resources/sequelize/builder';
import 'reflect-metadata';
import { FastAPI } from '..';

interface HandlerItem {
  resourceName: string;
  HandlerMethodType: HandlerMethodType;
}

export function getResourceName(resourceName: string | TableBuilder): string {
  if (typeof resourceName === 'string') {
    return resourceName;
  }

  return resourceName.name;
}

function innerHandlerDecorator(
  resourceName: string | TableBuilder,
  HandlerMethodType: HandlerMethodType
) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(
      'handler',
      {
        resourceName: getResourceName(resourceName),
        HandlerMethodType
      },
      target,
      key
    );

    return descriptor;
  };
}

export function Create(resourceName: string | TableBuilder) {
  return innerHandlerDecorator(resourceName, HandlerMethodType.CREATE);
}

export function GetAll(resourceName: string | TableBuilder) {
  return innerHandlerDecorator(resourceName, HandlerMethodType.GET_ALL);
}

export function GetOne(resourceName: string | TableBuilder) {
  return innerHandlerDecorator(resourceName, HandlerMethodType.GET_ONE);
}

export function Update(resourceName: string | TableBuilder) {
  return innerHandlerDecorator(resourceName, HandlerMethodType.UPDATE);
}

export function Remove(resourceName: string | TableBuilder) {
  return innerHandlerDecorator(resourceName, HandlerMethodType.REMOVE);
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
