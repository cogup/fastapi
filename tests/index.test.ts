import {
  FastAPI,
  makeResponses,
  Model,
  RoutesBuilder,
  SchemaBuilder,
  SchemaModelsBuilder,
  Sequelize
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
      const fastAPI = new FastAPI({
        autoLoadRoutes: false
      });
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
      const fastAPI = new FastAPI({
        autoLoadRoutes: false
      });
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

  describe('Features', () => {
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

    it('Search in column', async () => {
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

    it('Filter in column', async () => {
      const sequelize = new Sequelize('sqlite::memory:', {
        logging: false
      });

      class Posts extends Model {
        declare id: number;
        declare title: string;
        declare content: string;
        declare status: ['ACTIVE', 'INACTIVE'];
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
          },
          status: {
            type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
            defaultValue: 'ACTIVE'
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
        status: {
          filter: true
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
          content: 'You can make this with FastAPI',
          status: 'ACTIVE'
        }
      });

      await fastAPI.api.inject({
        method: 'POST',
        url: '/api/posts',
        payload: {
          title: 'What is FastAPI?',
          content: 'You have to know FastAPI',
          status: 'INACTIVE'
        }
      });

      await fastAPI.api.inject({
        method: 'POST',
        url: '/api/posts',
        payload: {
          title: 'Where is FastAPI?',
          content: 'No one knows',
          status: 'ACTIVE'
        }
      });

      const data1 = await fastAPI.api.inject({
        method: 'GET',
        url: '/api/posts?status=INACTIVE'
      });

      const item1 = data1.json();

      expect(item1.data.length).toEqual(1);

      const data2 = await fastAPI.api.inject({
        method: 'GET',
        url: '/api/posts?status=ACTIVE'
      });

      const item2 = data2.json();

      expect(item2.data.length).toEqual(2);
    });
  });
});
