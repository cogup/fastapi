import { generatePaths } from '../resources/openapi/index';
import { HandlerMethodType } from '../resources/routes';
import { TableBuilder } from '../resources/sequelize/builder';
import 'reflect-metadata';
import { SequelizeModel } from '../resources/sequelize';

export interface HandlerItem {
  resourceName: string;
  HandlerMethodType: HandlerMethodType;
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
