import {
  AutoColumn,
  Create,
  FastAPI,
  Get,
  HandlerType,
  MakeHandlers,
  makeResponses,
  MakeRouters,
  Model,
  Post,
  RoutesBuilder,
  SchemaBuilder,
  SchemaModelsBuilder,
  Sequelize,
  TableBuilder
} from '../src/index';
import { ResourceType } from '../src/resources/sequelize';
import { FastifyRequest, FastifyReply } from 'fastify';
import { DataTypes } from 'sequelize';

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
      const fastAPI = new FastAPI();

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

      class MyHandler extends MakeHandlers {
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

      fastAPI.loadSchema();
      fastAPI.loadRoutes();

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
      const fastAPI = new FastAPI();

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

      class MyHandler extends MakeHandlers {
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

      fastAPI.loadSchema();
      fastAPI.loadRoutes();

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
      const fastAPI = new FastAPI();

      interface PostRequestBody {
        message: string;
      }

      class MyRoutes extends MakeRouters {
        port: number = 0;

        onLoad(fastAPI: FastAPI): void {
          this.port = fastAPI.listenConfig.port ?? 0;
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
      const fastAPI = new FastAPI();

      interface PostRequestBody {
        message: string;
      }

      class MyRoutes extends MakeRouters {
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
      declare id: number;
      declare name: string;
      declare email: string;
    }

    enum UserStatus {
      ACTIVE = 'ACTIVE',
      INACTIVE = 'INACTIVE'
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
        },
        status: {
          type: DataTypes.ENUM(UserStatus.ACTIVE, UserStatus.INACTIVE),
          defaultValue: UserStatus.ACTIVE
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
      declare id: number;
      declare title: string;
      declare content: string;
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
      schema,
      sequelize
    });

    await sequelize.sync({ force: true });

    const data = await fastAPI.api.inject({
      method: 'POST',
      url: '/api/users',
      payload: {
        name: 'User 1',
        email: 'example@mail.com'
      }
    });

    expect(data.json()).toEqual({
      id: 1,
      name: 'User 1',
      email: 'example@mail.com',
      status: 'ACTIVE'
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
      id: 1,
      title: 'Post 1',
      content: 'Content 1'
    });
  });

  it('Search in collumn', async () => {
    const sequelize = new Sequelize('sqlite::memory:', {
      logging: false
    });

    class Posts extends Model {
      declare id: number;
      declare title: string;
      declare content: string;
    }

    Posts.init(
      {
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
        modelName: 'Posts',
        createdAt: true,
        updatedAt: true
      }
    );

    const schema = new SchemaModelsBuilder();

    schema.addResource(Posts, {
      title: {
        search: true
      },
      content: {
        search: true
      }
    });

    const fastAPI = new FastAPI({
      schema,
      sequelize
    });

    await sequelize.sync({ force: true });

    await fastAPI.api.inject({
      method: 'POST',
      url: '/api/posts',
      payload: {
        title: 'Why make this?',
        content: 'You can make this with FastAPI'
      }
    });

    await fastAPI.api.inject({
      method: 'POST',
      url: '/api/posts',
      payload: {
        title: 'What is FastAPI?',
        content: 'You have to know FastAPI'
      }
    });

    await fastAPI.api.inject({
      method: 'POST',
      url: '/api/posts',
      payload: {
        title: 'Where is FastAPI?',
        content: 'No one knows'
      }
    });

    const data = await fastAPI.api.inject({
      method: 'GET',
      url: '/api/posts?search=Where'
    });

    const item = data.json();

    const result = item.data[0];

    expect(result).toEqual({
      id: 3,
      title: 'Where is FastAPI?',
      content: 'No one knows',
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    });
  });

  describe('Test events', () => {
    it('Test events by Model', async () => {
      const sequelize = new Sequelize('sqlite::memory:', {
        logging: false
      });

      class User extends Model {
        declare id: number;
        declare name: string;
        declare email: string;
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

      const schema = new SchemaModelsBuilder();

      schema.addResource(User);

      const fastAPI = new FastAPI({
        schema,
        sequelize
      });

      fastAPI.on(User, HandlerType.CREATE, (err, data) => {
        expect(err).toBeFalsy();
        expect(data).toBeTruthy();
      });

      await fastAPI.api.inject({
        method: 'POST',
        url: '/api/users',
        payload: {
          name: 'User 1',
          email: 'test@test.test'
        }
      });
    });
  });

  it('Test events by Model', async () => {
    const sequelize = new Sequelize('sqlite::memory:', {
      logging: false
    });

    class User extends Model {
      declare id: number;
      declare name: string;
      declare email: string;
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

    const schema = new SchemaModelsBuilder();

    schema.addResource(User);

    const fastAPI = new FastAPI({
      schema,
      sequelize
    });

    fastAPI.on(User, HandlerType.CREATE, (err, data) => {
      expect(err).toBeFalsy();
      expect(data).toBeTruthy();
    });

    await fastAPI.api.inject({
      method: 'POST',
      url: '/api/users',
      payload: {
        name: 'User 1',
        email: 'test@test.test'
      }
    });
  });

  it('Test events custom model', async () => {
    const sequelize = new Sequelize('sqlite::memory:', {
      logging: false
    });

    class User extends Model {
      declare id: number;
      declare name: string;
      declare email: string;
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

    const schema = new SchemaModelsBuilder();

    schema.addResource(User);

    const fastAPI = new FastAPI({
      schema,
      sequelize
    });

    enum CustomEvent {
      TEST = 'TEST'
    }

    fastAPI.on(User, CustomEvent.TEST, (err, data) => {
      expect(err).toBeFalsy();
      expect(data).toBeTruthy();
    });

    fastAPI.emit(User, CustomEvent.TEST, null, { test: true });
  });

  it('Test events string', async () => {
    const fastAPI = new FastAPI();

    enum CustomEvent {
      TEST = 'TEST'
    }

    fastAPI.on('test', CustomEvent.TEST, (err, data) => {
      expect(err).toBeFalsy();
      expect(data).toBeTruthy();
    });

    fastAPI.emit('test', CustomEvent.TEST, null, { test: true });
  });

  it('Test events string and action number', async () => {
    const fastAPI = new FastAPI();

    fastAPI.on('test', 1, (err, data) => {
      expect(err).toBeFalsy();
      expect(data).toBeTruthy();
    });

    fastAPI.on('test', 2, (err, data) => {
      expect(err).toBeFalsy();
      expect(data).toBeTruthy();
    });

    fastAPI.emit('test', 2, null, { test: true });
  });
});
