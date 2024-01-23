import { Builder } from './builder';
import 'reflect-metadata';
export declare class BuilderInject {
    builder: Builder;
    constructor(builder: Builder);
}
export declare function loadBuilderClasses(): BuilderInject[];
export declare function inject<T extends {
    new (...args: any[]): {};
}>(ctr: T): T;
