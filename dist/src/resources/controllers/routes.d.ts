import { Resource } from '../sequelize';
import { Reply, Request } from '../../index';
export declare enum HandlerType {
    GET_ALL = "GET_ALL",
    GET_ONE = "GET_ONE",
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    REMOVE = "REMOVE"
}
export type RouteHandler = (request: Request, reply: Reply) => Promise<void> | void;
export declare function getAll(resource: Resource): RouteHandler;
export interface GetAllResponse {
    data: any[];
    meta: {
        offset: number;
        page: number;
        limit: number;
        totalPages: number;
        totalItems: number;
    };
}
export declare function getOne(resource: Resource): RouteHandler;
export declare function create(resource: Resource): RouteHandler;
export declare function update(resource: Resource): RouteHandler;
export declare function remove(resource: Resource): RouteHandler;
