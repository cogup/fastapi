import { Operation } from '../resources/openapi/openapiTypes';
import { MethodType, Routes } from '../resources/routes';
import 'reflect-metadata';
import { FastAPI } from '..';

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

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onLoad(fastAPI: FastAPI) {}

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
