import { superFilter } from './superFilter';
import { emitAction } from '../events';
import { Resource } from '../sequelize';
import { Reply, Request } from '../../index';
import { Op } from 'sequelize';
const { like, iLike } = Op;

export enum HandlerType {
  GET_ALL = 'GET_ALL',
  GET_ONE = 'GET_ONE',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  REMOVE = 'REMOVE'
}

interface GetAllQuery {
  limit?: string;
  search?: string;
  order?: string;
  orderBy?: string;
  page?: string;
  offset?: string;
}

export type RouteHandler = (
  request: Request,
  reply: Reply
) => Promise<void> | void;

export function getAll(resource: Resource): RouteHandler {
  return async (request: Request, reply: Reply) => {
    try {
      const query = request.query as GetAllQuery;
      const limit = query.limit !== undefined ? parseInt(query.limit, 10) : 10;
      const searchTerm = query.search;
      const order = query.order || 'desc';
      const orderBy = query.orderBy || 'updatedAt';
      const page = query.page !== undefined ? parseInt(query.page, 10) : 1;
      const offset =
        query.offset !== undefined
          ? parseInt(query.offset, 10)
          : (page - 1) * limit;

      const op =
        resource.model.sequelize?.getDialect() === 'postgres' ? iLike : like;

      const searchFilter =
        resource.search && searchTerm
          ? superFilter(resource.search, searchTerm, op)
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

      emitAction(resource.model, HandlerType.GET_ALL, null, data);
    } catch (err) {
      reply.log.error(err);
      reply.status(500).send({ error: `Failed to fetch ${resource.name}.` });
      emitAction(resource.model, HandlerType.GET_ALL, err);
    }
  };
}

interface GetOneUpdateRemoveParams {
  id: string;
}

export function getOne(resource: Resource): RouteHandler {
  return async (request: Request, reply: Reply) => {
    try {
      const params = request.params as GetOneUpdateRemoveParams;
      const data = await resource.model.findByPk(params.id, {
        attributes: { exclude: resource.noPropagateColumns }
      });

      if (!data?.dataValues) {
        reply.status(404).send({ error: `${resource.name} not found.` });
        return;
      }

      reply.send(data);
      emitAction(resource.model, HandlerType.GET_ONE, null, data);
    } catch (err) {
      reply.log.error(err);
      reply.status(500).send({ error: `Failed to fetch ${resource.name}.` });
      emitAction(resource.model, HandlerType.GET_ONE, err);
    }
  };
}

interface CreateUpdateBody {
  [key: string]: any;
}

export function create(resource: Resource): RouteHandler {
  return async (request: Request, reply: Reply) => {
    try {
      const body = request.body as CreateUpdateBody;

      if (resource.privateColumns.length) {
        for (const column of resource.privateColumns) {
          if (body[column] !== undefined) {
            reply.status(400).send({ error: `Cannot set ${column}.` });
            return;
          }
        }
      }

      const data = await resource.model.create(body as any);

      if (resource.noPropagateColumns.length) {
        for (const column of resource.noPropagateColumns) {
          delete data.dataValues[column];
        }
      }

      reply.status(201).send(data);
      emitAction(resource.model, HandlerType.CREATE, null, data);
    } catch (err) {
      reply.log.error(err);
      reply.status(500).send({ error: `Failed to create ${resource.name}.` });
      emitAction(resource.model, HandlerType.CREATE, err);
    }
  };
}

export function update(resource: Resource): RouteHandler {
  return async (request: Request, reply: Reply) => {
    try {
      const body = request.body as CreateUpdateBody;

      if (resource.privateColumns.length) {
        for (const column of resource.privateColumns) {
          if (body[column] !== undefined) {
            reply.status(400).send({ error: `Cannot set ${column}.` });
            return;
          }
        }
      }

      const params = request.params as GetOneUpdateRemoveParams;

      const data = await resource.model.findByPk(params.id);

      if (!data?.dataValues) {
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
      emitAction(resource.model, HandlerType.UPDATE, null, data);
    } catch (err) {
      reply.log.error(err);
      reply.status(500).send({ error: `Failed to update ${resource.name}.` });
      emitAction(resource.model, HandlerType.UPDATE, err);
    }
  };
}

export function remove(resource: Resource): RouteHandler {
  return async (request: Request, reply: Reply) => {
    try {
      const params = request.params as GetOneUpdateRemoveParams;
      const data = await resource.model.findByPk(params.id);

      if (!data) {
        reply.status(404).send({ error: `${resource.name} not found.` });
        return;
      }

      await data.destroy();

      reply
        .status(204)
        .send({ message: `${resource.name} deleted successfully.` });
      emitAction(resource.model, HandlerType.REMOVE, null, data);
    } catch (err) {
      reply.log.error(err);
      reply.status(500).send({ error: `Failed to delete ${resource.name}.` });
      emitAction(resource.model, HandlerType.REMOVE, err);
    }
  };
}
