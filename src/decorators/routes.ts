import { Operation } from '../resources/openapi/openapiTypes';
import { MethodType } from '../resources/routes';
import 'reflect-metadata';

export interface Route extends Operation {
  path: string;
  prefix?: string;
}

export interface RouteItem {
  route: Route;
  methodType: MethodType;
}

export function Get(route: string | Route) {
  return innerRoutesDecorator(route, MethodType.GET);
}

export function Post(route: string | Route) {
  return innerRoutesDecorator(route, MethodType.POST);
}

export function Put(route: string | Route) {
  return innerRoutesDecorator(route, MethodType.PUT);
}

export function Delete(route: string | Route) {
  return innerRoutesDecorator(route, MethodType.DELETE);
}

export function Patch(route: string | Route) {
  return innerRoutesDecorator(route, MethodType.PATCH);
}

function innerRoutesDecorator(route: string | Route, methodType: MethodType) {
  if (typeof route === 'string') {
    route = {
      path: route
    } as Route;
  }
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(
      'routes',
      {
        route,
        methodType
      },
      target,
      key
    );

    return descriptor;
  };
}
