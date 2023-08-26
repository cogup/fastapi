import { generatePaths } from '../resources/openapi/index';
import { HandlerMethodType, Handlers } from '../resources/routes';
import { TableBuilder } from '../resources/sequelize/builder';
import 'reflect-metadata';

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

export function Create(resourceName: string | TableBuilder) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(
      'handler',
      {
        resourceName: getResourceName(resourceName),
        HandlerMethodType: HandlerMethodType.CREATE
      },
      target,
      key
    );

    return descriptor;
  };
}

export function GetAll(resourceName: string | TableBuilder) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(
      'handler',
      {
        resourceName: getResourceName(resourceName),
        HandlerMethodType: HandlerMethodType.GET_ALL
      },
      target,
      key
    );

    return descriptor;
  };
}

export function GetOne(resourceName: string | TableBuilder) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(
      'handler',
      {
        resourceName: getResourceName(resourceName),
        HandlerMethodType: HandlerMethodType.GET_ONE
      },
      target,
      key
    );

    return descriptor;
  };
}

export function Update(resourceName: string | TableBuilder) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(
      'handler',
      {
        resourceName: getResourceName(resourceName),
        HandlerMethodType: HandlerMethodType.UPDATE
      },
      target,
      key
    );

    return descriptor;
  };
}

export function Remove(resourceName: string | TableBuilder) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(
      'handler',
      {
        resourceName: getResourceName(resourceName),
        HandlerMethodType: HandlerMethodType.REMOVE
      },
      target,
      key
    );

    return descriptor;
  };
}

export function getPathByMethod(
  resourceName: string,
  method: HandlerMethodType
): string {
  const paths = generatePaths(resourceName);
  
  if (method === HandlerMethodType.CREATE || method === HandlerMethodType.GET_ALL) {
    return paths.many;
  }

  return paths.single;
}

export class HandlerBuilder {
  [key: string]: any;

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
        const path = getPathByMethod(handler.resourceName, handler.HandlerMethodType);
        

        if (!handlers[handler.resourceName]) {
          handlers[path] = {};
        }

        handlers[path][handler.HandlerMethodType] = this[methodName];
      }
    }

    return handlers;
  }
}
