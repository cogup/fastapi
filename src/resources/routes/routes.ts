import { superFilter } from './superFilter';
import { emit } from '../events';
import { Resource } from '../sequelize';
import log from '../log';
import { parse } from 'path';
import { off } from 'process';

export type RouteHandler = (request: any, reply: any) => Promise<void> | void;

export function getAll(resource: Resource): RouteHandler {
  return async (request: any, reply: any) => {
    try {
      const limit = parseInt(request.query.limit, 10) || 10;
      const searchTerm = request.query.search;
      const order = request.query.order || 'desc';
      const orderBy = request.query.orderBy || 'updatedAt';
      const page = parseInt(request.query.page, 10) || 1;
      const offset = request.query.offset || (page - 1) * limit;

      const searchFilter =
        resource.search && searchTerm
          ? superFilter(resource.search, searchTerm)
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

      emit(resource.name, 'list', null, data.rows);
    } catch (err) {
      log.error(err);
      reply.status(500).send({ error: `Failed to fetch ${resource.name}.` });
      emit(resource.name, 'list', err);
    }
  };
}

export function getOne(resource: Resource): RouteHandler {
  return async (request: any, reply: any) => {
    try {
      const data = await resource.model.findByPk(request.params.id, {
        attributes: { exclude: resource.noPropagateColumns }
      });
      const values = data?.dataValues;

      if (!values) {
        reply.status(404).send({ error: `${resource.name} not found.` });
        return;
      }

      reply.send(data);
      emit(resource.name, 'read', null, values.rows);
    } catch (err) {
      log.error(err);
      reply.status(500).send({ error: `Failed to fetch ${resource.name}.` });
      emit(resource.name, 'read', err);
    }
  };
}

export function create(resource: Resource): RouteHandler {
  return async (request: any, reply: any) => {
    try {
      if (resource.privateColumns.length) {
        for (const column of resource.privateColumns) {
          if (request.body[column] !== undefined) {
            reply.status(400).send({ error: `Cannot set ${column}.` });
            return;
          }
        }
      }

      const data = await resource.model.create(request.body);

      if (resource.noPropagateColumns.length) {
        for (const column of resource.noPropagateColumns) {
          delete data.dataValues[column];
        }
      }

      reply.status(201).send(data);
      emit(resource.name, 'create', null, data);
    } catch (err) {
      log.error(err);
      reply.status(500).send({ error: `Failed to create ${resource.name}.` });
      emit(resource.name, 'create', err);
    }
  };
}

export function update(resource: Resource): RouteHandler {
  return async (request: any, reply: any) => {
    try {
      if (resource.privateColumns.length) {
        for (const column of resource.privateColumns) {
          if (request.body[column] !== undefined) {
            reply.status(400).send({ error: `Cannot set ${column}.` });
            return;
          }
        }
      }

      const data = await resource.model.findByPk(request.params.id);
      const value = data?.dataValues;

      if (!value) {
        reply.status(404).send({ error: `${resource.name} not found.` });
        return;
      }

      await data.update(request.body);

      if (resource.noPropagateColumns.length) {
        for (const column of resource.noPropagateColumns) {
          delete data.dataValues[column];
        }
      }

      reply.send(data);
      emit(resource.name, 'update', null, value.rows);
    } catch (err) {
      log.error(err);
      reply.status(500).send({ error: `Failed to update ${resource.name}.` });
      emit(resource.name, 'update', err);
    }
  };
}

export function remove(resource: Resource): RouteHandler {
  return async (request: any, reply: any) => {
    try {
      const data = await resource.model.findByPk(request.params.id);
      const value = data?.dataValues;

      if (!data) {
        reply.status(404).send({ error: `${resource.name} not found.` });
        return;
      }

      await data.destroy();

      reply
        .status(204)
        .send({ message: `${resource.name} deleted successfully.` });
      emit(resource.name, 'remove', null, value.rows);
    } catch (err) {
      log.error(err);
      reply.status(500).send({ error: `Failed to delete ${resource.name}.` });
      emit(resource.name, 'remove', err);
    }
  };
}
