import { Operation } from 'src/resources/openapi/openapiTypes';
import { generatePaths } from '../resources/openapi/index';
import {
  HandlerMethodType,
  Handlers,
  MethodType,
  Routes
} from '../resources/routes';
import { TableBuilder } from '../resources/sequelize/builder';
import 'reflect-metadata';
import { FastAPI } from 'src';

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

  constructor(_fastapi: FastAPI) {}

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

export interface Route extends Operation {
  path: string;
}

export interface RouteItem {
  route: Route;
  methodType: MethodType;
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

export class MakeRouters {
  [key: string]: any;

  constructor(_fastapi: FastAPI) {}

  getRoutes(): Routes {
    const routes: Routes = {};
    const controllerMethods = Object.getOwnPropertyNames(
      Object.getPrototypeOf(this)
    );

    for (const methodName of controllerMethods) {
      const route = Reflect.getMetadata(
        'routes',
        this,
        methodName
      ) as RouteItem;

      // add handler to handlers
      if (route) {
        if (!routes[route.route.path]) {
          routes[route.route.path] = {};
        }

        const { path, ...rest } = route.route;

        routes[path][route.methodType] = {
          ...rest,
          handler: this[methodName].bind(this)
        };
      }
    }

    return routes;
  }
}
