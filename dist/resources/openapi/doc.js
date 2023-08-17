"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFullDoc = void 0;
const utils_1 = require("./utils");
function createFullDoc(data) {
    const openapi = {
        openapi: '3.0.0',
        info: data.info,
        servers: data.servers,
        paths: resolvePaths(data.paths)
    };
    return (0, utils_1.convertOpenAPItoSchemas)(openapi);
}
exports.createFullDoc = createFullDoc;
const resolvePaths = (schemas) => {
    Object.keys(schemas).forEach((path) => {
        schemas[path].servers = [
            {
                url: process.env.APP_URL || 'http://localhost:3000'
            }
        ];
    });
    return schemas;
};
