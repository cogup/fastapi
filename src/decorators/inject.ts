import { Builder } from './builder';
import 'reflect-metadata';

const BUILDER_METADATA_KEY = 'custom:builderClasses';

export class BuilderInject {
  builder: Builder;

  constructor(builder: Builder) {
    this.builder = builder;
  }
}

export function loadBuilderClasses(): BuilderInject[] {
  const classes = Reflect.getMetadata(BUILDER_METADATA_KEY, Reflect) || [];
  return classes.map((cls: any) => new BuilderInject(new cls()));
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function inject<T extends { new (...args: any[]): {} }>(ctr: T) {
  const existingClasses =
    Reflect.getMetadata(BUILDER_METADATA_KEY, Reflect) || [];
  Reflect.defineMetadata(
    BUILDER_METADATA_KEY,
    [...existingClasses, ctr],
    Reflect
  );

  return ctr;
}
