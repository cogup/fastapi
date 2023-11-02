"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.update = exports.create = exports.getOne = exports.getAll = exports.HandlerType = void 0;
const superFilter_1 = require("./superFilter");
const events_1 = require("../events");
const log_1 = __importDefault(require("../log"));
const sequelize_1 = require("sequelize");
const { like, iLike } = sequelize_1.Op;
var HandlerType;
(function (HandlerType) {
    HandlerType["GET_ALL"] = "GET_ALL";
    HandlerType["GET_ONE"] = "GET_ONE";
    HandlerType["CREATE"] = "CREATE";
    HandlerType["UPDATE"] = "UPDATE";
    HandlerType["REMOVE"] = "REMOVE";
})(HandlerType || (exports.HandlerType = HandlerType = {}));
function getAll(resource) {
    return async (request, reply) => {
        try {
            const query = request.query;
            const limit = query.limit !== undefined ? parseInt(query.limit, 10) : 10;
            const searchTerm = query.search;
            const order = query.order || 'desc';
            const orderBy = query.orderBy || 'updatedAt';
            const page = query.page !== undefined ? parseInt(query.page, 10) : 1;
            const offset = query.offset !== undefined
                ? parseInt(query.offset, 10)
                : (page - 1) * limit;
            const op = resource.model.sequelize?.getDialect() === 'postgres' ? iLike : like;
            const searchFilter = resource.search && searchTerm
                ? (0, superFilter_1.superFilter)(resource.search, searchTerm, op)
                : {};
            const data = await resource.model.findAndCountAll({
                where: searchFilter,
                offset,
                limit,
                order: [[orderBy, order]],
                attributes: { exclude: resource.noPropagateColumns }
            });
            const totalPages = Math.ceil(data.count / limit);
            const currentPage = Math.ceil(offset / limit) + 1;
            reply.send({
                data: data.rows,
                meta: {
                    offset,
                    page: currentPage,
                    limit,
                    totalPages,
                    totalItems: data.count
                }
            });
            (0, events_1.emit)(resource.model, HandlerType.GET_ALL, null, data.rows);
        }
        catch (err) {
            log_1.default.error(err);
            reply.status(500).send({ error: `Failed to fetch ${resource.name}.` });
            (0, events_1.emit)(resource.model, HandlerType.GET_ALL, err);
        }
    };
}
exports.getAll = getAll;
function getOne(resource) {
    return async (request, reply) => {
        try {
            const params = request.params;
            const data = await resource.model.findByPk(params.id, {
                attributes: { exclude: resource.noPropagateColumns }
            });
            const values = data?.dataValues;
            if (!values) {
                reply.status(404).send({ error: `${resource.name} not found.` });
                return;
            }
            reply.send(data);
            (0, events_1.emit)(resource.model, HandlerType.GET_ONE, null, values.rows);
        }
        catch (err) {
            log_1.default.error(err);
            reply.status(500).send({ error: `Failed to fetch ${resource.name}.` });
            (0, events_1.emit)(resource.model, HandlerType.GET_ONE, err);
        }
    };
}
exports.getOne = getOne;
function create(resource) {
    return async (request, reply) => {
        try {
            const body = request.body;
            if (resource.privateColumns.length) {
                for (const column of resource.privateColumns) {
                    if (body[column] !== undefined) {
                        reply.status(400).send({ error: `Cannot set ${column}.` });
                        return;
                    }
                }
            }
            const data = await resource.model.create(body);
            if (resource.noPropagateColumns.length) {
                for (const column of resource.noPropagateColumns) {
                    delete data.dataValues[column];
                }
            }
            reply.status(201).send(data);
            (0, events_1.emit)(resource.model, HandlerType.CREATE, null, data);
        }
        catch (err) {
            log_1.default.error(err);
            reply.status(500).send({ error: `Failed to create ${resource.name}.` });
            (0, events_1.emit)(resource.model, HandlerType.CREATE, err);
        }
    };
}
exports.create = create;
function update(resource) {
    return async (request, reply) => {
        try {
            const body = request.body;
            if (resource.privateColumns.length) {
                for (const column of resource.privateColumns) {
                    if (body[column] !== undefined) {
                        reply.status(400).send({ error: `Cannot set ${column}.` });
                        return;
                    }
                }
            }
            const params = request.params;
            const data = await resource.model.findByPk(params.id);
            const value = data?.dataValues;
            if (!value) {
                reply.status(404).send({ error: `${resource.name} not found.` });
                return;
            }
            await data.update(body);
            if (resource.noPropagateColumns.length) {
                for (const column of resource.noPropagateColumns) {
                    delete data.dataValues[column];
                }
            }
            reply.send(data);
            (0, events_1.emit)(resource.model, HandlerType.UPDATE, null, value.rows);
        }
        catch (err) {
            log_1.default.error(err);
            reply.status(500).send({ error: `Failed to update ${resource.name}.` });
            (0, events_1.emit)(resource.model, HandlerType.UPDATE, err);
        }
    };
}
exports.update = update;
function remove(resource) {
    return async (request, reply) => {
        try {
            const params = request.params;
            const data = await resource.model.findByPk(params.id);
            const value = data?.dataValues;
            if (!data) {
                reply.status(404).send({ error: `${resource.name} not found.` });
                return;
            }
            await data.destroy();
            reply
                .status(204)
                .send({ message: `${resource.name} deleted successfully.` });
            (0, events_1.emit)(resource.model, HandlerType.REMOVE, null, value.rows);
        }
        catch (err) {
            log_1.default.error(err);
            reply.status(500).send({ error: `Failed to delete ${resource.name}.` });
            (0, events_1.emit)(resource.model, HandlerType.REMOVE, err);
        }
    };
}
exports.remove = remove;