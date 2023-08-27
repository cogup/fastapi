import { FastifyReply, FastifyRequest } from 'fastify';
import {
  AutoColumn,
  FastAPI,
  makeResponses,
  RoutesBuilder,
  SchemaBuilder,
  TableBuilder
} from '../src/index';
import { Sequelize } from 'sequelize';
import { ColumnType } from '../src/resources/sequelize';
import { Decorators } from '../src';

const portsUsed: number[] = [];
function getRandomPort() {
  let port = 0;

  do {
    port = Math.floor(Math.random() * 65535) + 1;
  } while (portsUsed.includes(port));

  return port;
}

describe('FastAPI', () => {
  describe('Lib and Loaders', () => {
    it('should initialize FastAPI with default values if no parameters are passed', () => {
      const fastAPI = new FastAPI();
      fastAPI.api.log.level = 'silent';

      expect(fastAPI).toBeInstanceOf(FastAPI);
    });

    it('should initialize FastAPI with the passed parameters', () => {
      const fastAPI = new FastAPI();
      fastAPI.api.log.level = 'silent';

      fastAPI.setDatabase({
        database: 'testDB',
        username: 'testUser',
        password: 'testPassword'
      });

      expect(fastAPI.database.database).toEqual('testDB');
      expect(fastAPI.database.username).toEqual('testUser');
      expect(fastAPI.database.password).toEqual('testPassword');
    });
    it('should add a schema for hello', async () => {
      const fastAPI = new FastAPI();
      fastAPI.api.log.level = 'silent';

      const schema = new SchemaBuilder();
      const helloSchema = schema
        .table('hello')
        .column({
          name: 'id',
          type: ColumnType.INT,
          primaryKey: true,
          autoIncrement: true
        })
        .column({
          name: 'message',
          type: ColumnType.STRING,
          allowNull: false
        })
        .column({
          name: 'createdAt',
          type: ColumnType.DATE
        })
        .column({
          name: 'updatedAt',
          type: ColumnType.DATE
        })
        .build()
        .schema.build();

      const mockHello = {
        message: 'Hello, world!'
      };

      const sequelize = new Sequelize('sqlite::memory:', {
        logging: false
      });

      fastAPI.setDatabaseInstance(sequelize);

      fastAPI.loadSchema(helloSchema);

      const { Hello } = fastAPI.models;

      await Hello.sync({ force: true });

      await Hello.create(mockHello);

      const result = await Hello.findOne({
        where: { message: mockHello.message }
      });

      expect(result).toBeTruthy();
      expect(result?.dataValues.message).toBe(mockHello.message);
    });

    it('should add a route for /hello', async () => {
      const fastAPI = new FastAPI();
      fastAPI.api.log.level = 'silent';

      fastAPI.get('/', {
        responses: makeResponses('init', 222, {
          message: {
            type: ColumnType.STRING
          }
        }),
        handler: (_request: FastifyRequest, reply: FastifyReply) => {
          reply.status(222).send({
            message: 'Hello, world!'
          });
        }
      });

      fastAPI.loadRoutes();

      const response = await fastAPI.api.inject({
        method: 'GET',
        url: '/'
      });

      expect(response.statusCode).toBe(222);
      expect(response.json()).toEqual({ message: 'Hello, world!' });
    });

    it('should add a route for /hello 2', async () => {
      const fastAPI = new FastAPI();
      fastAPI.api.log.level = 'silent';
      const routes = new RoutesBuilder();
      const builded = routes
        .path('/')
        .get({
          responses: makeResponses('init', 222, {
            message: {
              type: ColumnType.STRING
            }
          }),
          handler: (_request: FastifyRequest, reply: FastifyReply) => {
            reply.status(222).send({
              message: 'Hello, world!'
            });
          }
        })
        .build();

      fastAPI.addRoutes(builded);

      fastAPI.loadRoutes();

      const response = await fastAPI.api.inject({
        method: 'GET',
        url: '/'
      });

      expect(response.statusCode).toBe(222);
      expect(response.json()).toEqual({ message: 'Hello, world!' });

      await fastAPI.api.close();
    });
  });

  describe('Schema and Server', () => {
    const fastAPI = new FastAPI({
      listen: {
        port: 30000
      }
    });

    beforeAll(async () => {
      const schema = new SchemaBuilder({
        auto: [AutoColumn.ID, AutoColumn.CREATED_AT, AutoColumn.UPDATED_AT]
      });

      const messageTable = new TableBuilder({
        name: 'messages',
        schema: schema,
        auto: [AutoColumn.ID, AutoColumn.CREATED_AT, AutoColumn.UPDATED_AT]
      })
        .column({
          name: 'message',
          type: ColumnType.CODE,
          allowNull: false
        })
        .column({
          name: 'privateData',
          type: ColumnType.STRING,
          defaultValue: 'privateDefault',
          private: true
        })
        .column({
          name: 'protectedData',
          type: ColumnType.STRING,
          protected: true
        })
        .build();

      new TableBuilder({
        name: 'chats',
        schema: schema,
        auto: [AutoColumn.ID, AutoColumn.CREATED_AT, AutoColumn.UPDATED_AT]
      })
        .column({
          name: 'messageId',
          type: ColumnType.INT,
          allowNull: false,
          reference: messageTable
        })
        .build();

      const sequelize = new Sequelize('sqlite::memory:', {
        logging: false
      });

      fastAPI.setSchema(schema.build());

      fastAPI.setDatabaseInstance(sequelize);
    });

    afterAll(async () => {
      await fastAPI.api.close();
    });

    it('should start the server', async () => {
      await fastAPI.start();
    });

    it('should post', async () => {
      const responsePost = await fastAPI.api.inject({
        method: 'POST',
        url: '/api/messages',
        payload: {
          message: 'Hello, world!',
          protectedData: 'protected'
        }
      });

      const responsePost2 = await fastAPI.api.inject({
        method: 'POST',
        url: '/api/messages',
        payload: {
          message: 'Hello, world 2!',
          protectedData: 'protected'
        }
      });

      expect(responsePost.statusCode).toBe(201);

      const data1 = responsePost.json();
      delete data1.createdAt;
      delete data1.updatedAt;

      expect(data1).toEqual({
        id: 1,
        message: 'Hello, world!'
      });

      expect(responsePost2.statusCode).toBe(201);

      const data2 = responsePost2.json();
      delete data2.createdAt;
      delete data2.updatedAt;

      expect(data2).toEqual({
        id: 2,
        message: 'Hello, world 2!'
      });
    });

    it('should get', async () => {
      const responseGet = await fastAPI.api.inject({
        method: 'GET',
        url: '/api/messages'
      });

      expect(responseGet.statusCode).toBe(200);

      const { data, meta } = responseGet.json();
      const dataClean = data.map(
        (
          item: Record<string, string | number>
        ): Record<string, string | number> => {
          delete item.createdAt;
          delete item.updatedAt;
          return item;
        }
      );

      expect({ data: dataClean, meta }).toEqual({
        data: [
          {
            id: 2,
            message: 'Hello, world 2!'
          },
          {
            id: 1,
            message: 'Hello, world!'
          }
        ],
        meta: { page: 1, pageSize: 10, totalPages: 1, totalItems: 2 }
      });
    });

    it('should get by id', async () => {
      const responseGet = await fastAPI.api.inject({
        method: 'GET',
        url: '/api/messages/1'
      });

      expect(responseGet.statusCode).toBe(200);

      const data = responseGet.json();
      delete data.createdAt;
      delete data.updatedAt;

      expect(data).toEqual({
        id: 1,
        message: 'Hello, world!'
      });
    });

    it('should put', async () => {
      const responsePut = await fastAPI.api.inject({
        method: 'PUT',
        url: '/api/messages/1',
        payload: {
          message: 'Hello, world 3!',
          protectedData: 'protected 2'
        }
      });

      expect(responsePut.statusCode).toBe(200);

      const data = responsePut.json();
      delete data.createdAt;
      delete data.updatedAt;

      expect(data).toEqual({
        id: 1,
        message: 'Hello, world 3!'
      });
    });

    it('should delete', async () => {
      const responseDelete = await fastAPI.api.inject({
        method: 'DELETE',
        url: '/api/messages/1'
      });

      expect(responseDelete.statusCode).toBe(204);
    });

    it('should get by id not found', async () => {
      const responseGet = await fastAPI.api.inject({
        method: 'GET',
        url: '/api/messages/1'
      });

      expect(responseGet.statusCode).toBe(404);
    });

    it('should get health', async () => {
      const responseGet = await fastAPI.api.inject({
        method: 'GET',
        url: '/health'
      });

      expect(responseGet.statusCode).toBe(200);
      expect(responseGet.json()).toEqual({
        status: 'UP'
      });
    });

    it('should get all info health', async () => {
      const responseGet = await fastAPI.api.inject({
        method: 'GET',
        url: '/health/all'
      });

      expect(responseGet.statusCode).toBe(200);
    });

    it('should get openapi especification', async () => {
      const responseGet = await fastAPI.api.inject({
        method: 'GET',
        url: '/openapi.json'
      });

      expect(responseGet.statusCode).toBe(200);
    });

    it('should relationship', async () => {
      const data = await fastAPI.api.inject({
        method: 'POST',
        url: '/api/chats',
        payload: {
          messageId: 1,
          protectedData: 'protected'
        }
      });

      expect(data.statusCode).toBe(201);

      const responseGet = await fastAPI.api.inject({
        method: 'GET',
        url: '/api/chats/1'
      });

      expect(responseGet.statusCode).toBe(200);
    });
  });

  describe('Test api', () => {
    it('Teste Lib Api', async () => {
      const fastAPI = new FastAPI({
        listen: {
          port: getRandomPort()
        }
      });

      const schema = new SchemaBuilder({
        auto: [AutoColumn.ID, AutoColumn.CREATED_AT, AutoColumn.UPDATED_AT]
      });

      const messageTable = new TableBuilder({
        name: 'messages',
        schema: schema,
        auto: [AutoColumn.ID, AutoColumn.CREATED_AT, AutoColumn.UPDATED_AT],
        group: 'msg'
      })
        .column({
          name: 'name',
          type: ColumnType.STRING,
          allowNull: false
        })
        .build();

      new TableBuilder({
        name: 'chats',
        schema: schema,
        auto: [AutoColumn.ID, AutoColumn.CREATED_AT, AutoColumn.UPDATED_AT],
        group: 'msg'
      })
        .column({
          name: 'messageId',
          type: ColumnType.INT,
          allowNull: false,
          reference: messageTable
        })
        .build();

      new TableBuilder({
        name: 'settings',
        schema: schema,
        auto: [AutoColumn.ID, AutoColumn.CREATED_AT, AutoColumn.UPDATED_AT]
      })
        .column({
          name: 'name',
          type: ColumnType.STRING
        })
        .build();

      const sequelize = new Sequelize('sqlite::memory:', {
        logging: false
      });

      fastAPI.setSchema(schema.build());

      fastAPI.setDatabaseInstance(sequelize);

      fastAPI.loadAll();
    });
  });

  describe('Test Decorations', () => {
    it('Test Handlers', async () => {
      const fastAPI = new FastAPI({
        listen: {
          port: getRandomPort()
        }
      });

      const schema = new SchemaBuilder({
        auto: [AutoColumn.ID, AutoColumn.CREATED_AT, AutoColumn.UPDATED_AT]
      });

      const messages = new TableBuilder({
        name: 'messages',
        schema: schema,
        auto: [AutoColumn.ID, AutoColumn.CREATED_AT, AutoColumn.UPDATED_AT],
        group: 'msg'
      })
        .column({
          name: 'message',
          type: ColumnType.STRING
        })
        .build();

      const chats = new TableBuilder({
        name: 'chats',
        schema: schema,
        auto: [AutoColumn.ID, AutoColumn.CREATED_AT, AutoColumn.UPDATED_AT],
        group: 'msg'
      })
        .column({
          name: 'message',
          type: ColumnType.STRING
        })
        .build();

      const { Create } = Decorators;

      class MyHandler extends Decorators.MakeHandlers {
        @Create(messages)
        messagesCreate(_request: FastifyRequest, reply: FastifyReply) {
          reply.status(201).send({
            message: 'Hello, Message!'
          });
        }

        @Create(chats)
        chatCreate(_request: FastifyRequest, reply: FastifyReply) {
          reply.status(201).send({
            message: 'Hello, Chat!'
          });
        }
      }

      const sequelize = new Sequelize('sqlite::memory:', {
        logging: false
      });

      fastAPI.setSchema(schema.build());
      fastAPI.setDatabaseInstance(sequelize);

      fastAPI.addHandlers(MyHandler);

      fastAPI.loadAll();

      const data = await fastAPI.api.inject({
        method: 'POST',
        url: '/api/messages',
        payload: {
          messageId: 1,
          protectedData: 'protected'
        }
      });

      expect(data.json()).toEqual({
        message: 'Hello, Message!'
      });

      const data2 = await fastAPI.api.inject({
        method: 'POST',
        url: '/api/chats',
        payload: {
          messageId: 1,
          protectedData: 'protected'
        }
      });

      expect(data2.json()).toEqual({
        message: 'Hello, Chat!'
      });
    });

    it('Test Routes', async () => {
      const fastAPI = new FastAPI({
        listen: {
          port: getRandomPort()
        }
      });

      interface PostRequestBody {
        message: string;
      }

      const { Get, Post } = Decorators;

      class MyRoutes extends Decorators.MakeRouters {
        port: number = 0;

        onLoad(fastapi: FastAPI): void {
          this.port = fastapi.listenConfig.port ?? 0;
        }

        @Get('/test')
        test1(_request: FastifyRequest, reply: FastifyReply) {
          reply.status(200).send({
            message: `Test get in port ${this.port}`
          });
        }

        @Post({
          path: '/test',
          responses: makeResponses('init', 201, {
            message: {
              type: ColumnType.STRING
            }
          }),
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          }
        })
        test2(request: FastifyRequest, reply: FastifyReply) {
          const { message } = request.body as PostRequestBody;
          reply.status(201).send({
            message: `Test post ${message}`
          });
        }
      }

      const sequelize = new Sequelize('sqlite::memory:', {
        logging: false
      });

      fastAPI.setDatabaseInstance(sequelize);

      fastAPI.addRoutes(MyRoutes);

      fastAPI.loadRoutes();

      fastAPI.afterLoadExecute();

      const data = await fastAPI.api.inject({
        method: 'GET',
        url: '/test'
      });

      expect(data.json()).toEqual({
        message: `Test get in port ${fastAPI.listenConfig.port}`
      });

      const data2 = await fastAPI.api.inject({
        method: 'POST',
        url: '/test'
      });

      expect(data2.statusCode).toBe(400);

      const data3 = await fastAPI.api.inject({
        method: 'POST',
        url: '/test',
        payload: {
          message: 'Uhuu'
        }
      });

      expect(data3.json()).toEqual({
        message: 'Test post Uhuu'
      });
    });
  });
});
