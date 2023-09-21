import { FastifyReply, FastifyRequest } from 'fastify';
import {
  AutoColumn,
  FastAPI,
  makeResponses,
  RoutesBuilder,
  SchemaBuilder,
  SchemaModelsBuilder,
  TableBuilder
} from '../src/index';
import { Sequelize } from 'sequelize';
import { ResourceType } from '../src/resources/sequelize';
import { Decorators } from '../src';
import { Model, DataTypes } from 'sequelize';

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

    it('should add a schema for hello', async () => {
      const sequelize = new Sequelize('sqlite::memory:', {
        logging: false
      });

      const fastAPI = new FastAPI({
        sequelize
      });

      fastAPI.api.log.level = 'silent';

      const schema = new SchemaBuilder();
      const helloSchema = schema
        .table('hello')
        .column({
          name: 'id',
          type: ResourceType.INT,
          primaryKey: true,
          autoIncrement: true
        })
        .column({
          name: 'message',
          type: ResourceType.STRING,
          allowNull: false
        })
        .column({
          name: 'createdAt',
          type: ResourceType.DATE
        })
        .column({
          name: 'updatedAt',
          type: ResourceType.DATE
        })
        .build()
        .schema.build();

      await sequelize.sync({ force: true });

      const mockHello = {
        message: 'Hello, world!'
      };

      fastAPI.loadSchema(helloSchema);

      const { Hello } = fastAPI.models;

      await Hello.sync({ force: true });

      await Hello.create(mockHello);

      const result = await Hello.findOne({
        where: { message: mockHello.message }
      });

      expect(result).toBeTruthy();
      expect(result?.dataValues.message).toBe(mockHello.message);

      await sequelize.close();
      await fastAPI.api.close();
    });

    it('should add a route for /hello', async () => {
      const fastAPI = new FastAPI();
      fastAPI.api.log.level = 'silent';

      fastAPI.get('/', {
        responses: makeResponses('init', 222, {
          message: {
            type: ResourceType.STRING
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
              type: ResourceType.STRING
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
          type: ResourceType.STRING
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
          type: ResourceType.STRING
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

      await sequelize.sync({ force: true });

      fastAPI.setSchema(schema.build());
      fastAPI.setSequelize(sequelize);

      fastAPI.addHandlers(MyHandler);

      fastAPI.loadResources();

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

      await sequelize.close();
      await fastAPI.api.close();
    });

    it('Test Handlers Instancied', async () => {
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
          type: ResourceType.STRING
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
          type: ResourceType.STRING
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

      await sequelize.sync({ force: true });
      fastAPI.setSchema(schema.build());
      fastAPI.setSequelize(sequelize);

      fastAPI.addHandlers(new MyHandler());

      fastAPI.loadResources();

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

      await sequelize.close();
      await fastAPI.api.close();
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
              type: ResourceType.STRING
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

      await sequelize.sync({ force: true });

      fastAPI.setSequelize(sequelize);

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

      await sequelize.close();
      await fastAPI.api.close();
    });

    it('Test Routes Instancied', async () => {
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

        constructor(port: number) {
          super();
          this.port = port;
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
              type: ResourceType.STRING
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

      await sequelize.sync({ force: true });

      fastAPI.setSequelize(sequelize);

      fastAPI.addRoutes(new MyRoutes(fastAPI.listenConfig.port as number));

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

      await sequelize.close();
      await fastAPI.api.close();
    });
  });

  it('Test sequelize Model', async () => {
    const sequelize = new Sequelize('sqlite::memory:', {
      logging: false
    });

    class User extends Model {
      id!: number;
      name!: string;
      email!: string;
    }

    User.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        name: {
          type: DataTypes.STRING
        },
        email: {
          type: DataTypes.STRING
        }
      },
      {
        sequelize,
        modelName: 'User',
        createdAt: false,
        updatedAt: false
      }
    );

    class Post extends Model {
      id!: number;
      title!: string;
      content!: string;
    }

    Post.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        title: {
          type: DataTypes.STRING,
          allowNull: false
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false
        }
      },
      {
        sequelize,
        modelName: 'Post',
        createdAt: false,
        updatedAt: false
      }
    );

    const schema = new SchemaModelsBuilder();

    schema.addResource(User);
    schema.addResource(Post, {
      content: {
        type: ResourceType.CODE
      }
    });

    const fastAPI = new FastAPI({
      listen: {
        port: getRandomPort()
      },
      schema,
      sequelize
    });

    await sequelize.sync({ force: true });

    await fastAPI.start();

    const data = await fastAPI.api.inject({
      method: 'POST',
      url: '/api/users',
      payload: {
        name: 'User 1',
        email: 'example@mail.com'
      }
    });

    expect(data.json()).toEqual({
      id: 0,
      name: 'User 1',
      email: 'example@mail.com'
    });

    const data2 = await fastAPI.api.inject({
      method: 'POST',
      url: '/api/posts',
      payload: {
        title: 'Post 1',
        content: 'Content 1'
      }
    });

    expect(data2.json()).toEqual({
      id: 0,
      title: 'Post 1',
      content: 'Content 1'
    });

    await sequelize.close();
    await fastAPI.api.close();
  });
});
