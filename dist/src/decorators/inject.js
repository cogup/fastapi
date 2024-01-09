"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inject = exports.loadBuilderClasses = exports.BuilderInject = void 0;
require("reflect-metadata");
const BUILDER_METADATA_KEY = 'custom:builderClasses';
class BuilderInject {
    builder;
    constructor(builder) {
        this.builder = builder;
    }
}
exports.BuilderInject = BuilderInject;
function loadBuilderClasses() {
    const classes = Reflect.getMetadata(BUILDER_METADATA_KEY, Reflect) || [];
    return classes.map((cls) => new BuilderInject(new cls()));
}
exports.loadBuilderClasses = loadBuilderClasses;
// eslint-disable-next-line @typescript-eslint/ban-types
function inject(ctr) {
    const existingClasses = Reflect.getMetadata(BUILDER_METADATA_KEY, Reflect) || [];
    Reflect.defineMetadata(BUILDER_METADATA_KEY, [...existingClasses, ctr], Reflect);
    return ctr;
}
exports.inject = inject;
