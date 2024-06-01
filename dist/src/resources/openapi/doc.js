"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFullDoc = void 0;
const utils_1 = require("./utils");
function createFullDoc(data) {
    const openapi = {
        openapi: '3.0.0',
        info: data.info,
        servers: data.servers,
        paths: resolvePaths(data.paths),
        'x-admin': data.admin
    };
    return (0, utils_1.convertOpenAPItoSchemas)(openapi);
}
exports.createFullDoc = createFullDoc;
const resolvePaths = (schemas) => {
    const cloneSchemas = { ...schemas };
    Object.keys(cloneSchemas).forEach((path) => {
        const pathItem = cloneSchemas[path];
        pathItem.servers = [
            {
                url: process.env.APP_URL || 'http://localhost:3000'
            }
        ];
        if (pathItem.get && pathItem.get.handler) {
            delete pathItem.get.handler;
        }
        if (pathItem.post && pathItem.post.handler) {
            delete pathItem.post.handler;
        }
        if (pathItem.put && pathItem.put.handler) {
            delete pathItem.put.handler;
        }
        if (pathItem.delete && pathItem.delete.handler) {
            delete pathItem.delete.handler;
        }
        if (pathItem.patch && pathItem.patch.handler) {
            delete pathItem.patch.handler;
        }
        if (pathItem.options && pathItem.options.handler) {
            delete pathItem.options.handler;
        }
        if (pathItem.head && pathItem.head.handler) {
            delete pathItem.head.handler;
        }
        if (pathItem.trace && pathItem.trace.handler) {
            delete pathItem.trace.handler;
        }
        cloneSchemas[path] = pathItem;
    });
    return cloneSchemas;
};
