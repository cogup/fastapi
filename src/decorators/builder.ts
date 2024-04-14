import 'reflect-metadata';
import { FastAPI, Handlers } from '..';
import { on, onAction } from '../resources/events';
import { HandlerItem, getPathByMethod } from './handlers';
import { CustomActionItem, CustomEventItem } from './events';
import { RouteItem } from './routes';
import { Controllers } from '../resources/routes';

export interface BuilderItems {
  routes?: Controllers;
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
      const actions = Reflect.getMetadata(
        'actions',
        this,
        methodName
      ) as CustomActionItem;

      if (actions) {
        onAction(actions.model, actions.action, this[methodName].bind(this));
      }

      const events = Reflect.getMetadata(
        'events',
        this,
        methodName
      ) as CustomEventItem;

      if (events) {
        on(events.eventKey, this[methodName].bind(this));
      }
    }
  }

  loadHandlers(prefix: string): Handlers {
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
          handler.HandlerMethodType,
          prefix
        );

        if (!handlers[handler.resourceName]) {
          handlers[path] = {};
        }

        handlers[path][handler.HandlerMethodType] = this[methodName].bind(this);
      }
    }

    return handlers;
  }

  loadRoutes(defaultPrefix: string): Controllers {
    const controllers: Controllers = {};
    const controllerMethods = Object.getOwnPropertyNames(
      Object.getPrototypeOf(this)
    );

    for (const methodName of controllerMethods) {
      const route = Reflect.getMetadata(
        'routes',
        this,
        methodName
      ) as RouteItem;

      if (route) {
        const { path, prefix, ...rest } = route.route;
        const fixPath = `${prefix ?? defaultPrefix}${path}`;

        if (!controllers[fixPath]) {
          controllers[fixPath] = {};
        }

        controllers[fixPath][route.methodType] = {
          ...rest,
          handler: this[methodName].bind(this)
        };
      }
    }
    return controllers;
  }
}
