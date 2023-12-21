import { Handlers, Routes } from '../resources/routes';
import { on, onAction } from '../resources/events';
import { CustomActionItem, CustomEventItem } from './events';
import { HandlerItem, getPathByMethod } from './handlers';
import { RouteItem } from './routes';
import 'reflect-metadata';

const BUILDER_METADATA_KEY = 'custom:builderClasses';

export interface IBuilderClass {
  new (...args: any[]): any;
}

export function loadBuilderClasses(): IBuilderClass[] {
  const classes = Reflect.getMetadata(BUILDER_METADATA_KEY, Reflect) || [];
  return classes.map((cls: IBuilderClass) => new cls());
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function builder<T extends { new (...args: any[]): {} }>(ctr: T) {
  const extendedClass = class extends ctr {
    [key: string]: any;

    constructor(...args: any[]) {
      super(...args);
    }

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

          handlers[path][handler.HandlerMethodType] =
            this[methodName].bind(this);
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
  };

  const existingClasses =
    Reflect.getMetadata(BUILDER_METADATA_KEY, Reflect) || [];
  Reflect.defineMetadata(
    BUILDER_METADATA_KEY,
    [...existingClasses, extendedClass],
    Reflect
  );

  return extendedClass;
}
