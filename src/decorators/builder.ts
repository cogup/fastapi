import 'reflect-metadata';
import { FastAPI, Handlers } from '..';
import { onAction } from '../resources/events';
import { HandlerItem, getPathByMethod } from './handlers';
import { CustomEventItem } from './events';
import { RouteItem } from './routes';
import { Routes } from 'resources/routes';

export interface BuilderItems {
  routes?: Routes;
  handlers?: Handlers;
}

export class Builder {
  [key: string]: any;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onLoad(fastAPI: FastAPI) {}

  loadEvents(): void {
    const controllerMethods = Object.getOwnPropertyNames(
      Object.getPrototypeOf(this)
    );

    for (const methodName of controllerMethods) {
      const events = Reflect.getMetadata(
        'events',
        this,
        methodName
      ) as CustomEventItem;

      if (events) {
        onAction(events.model, events.action, this[methodName].bind(this));
      }
    }
  }

  loadHandlers(): Handlers {
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

  loadRoutes(): Routes {
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
