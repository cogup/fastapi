import { emit, getEventsStorage } from '../src/resources/events';
import {
  FastAPI,
  OnCreate,
  OnEvent,
  Builder,
  Reply,
  Update,
  Get
} from '../src';
import { sequelize, schema, Message } from './utils/message';

describe('Decorators', () => {
  it('Test OnLoad', async () => {
    let result: any = null;
    let onLoaded = false;
    let done = false;

    class MessageTest extends Builder {
      message?: string;

      onLoad(): void {
        onLoaded = true;
        this.message = 'Hello World';
      }

      @OnCreate(Message)
      async eventCreateMessage(err: any, data: any) {
        if (err) {
          throw err;
        }

        result = data;
      }

      @OnEvent('done')
      async done(_err: any, data: boolean) {
        done = data;
      }

      @Update(Message)
      async getMessage(_request: Request, reply: Reply) {
        reply.status(201).send({
          message: this.message
        });
        emit('done', null, true);
      }

      @Get({
        path: '/test',
        summary: 'Test',
        description: 'Test',
        tags: ['test'],
        responses: {
          200: {
            description: 'Test',
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
        }
      })
      async test(_request: Request, reply: Reply) {
        reply.status(201).send({
          message: this.message
        });
      }
    }

    const fastAPI = new FastAPI({
      sequelize,
      schema,
      events: [MessageTest],
      handlers: [MessageTest],
      routes: [MessageTest]
    });

    await fastAPI.sequelize?.sync();

    const eventsStorage = getEventsStorage();
    expect(Object.keys(eventsStorage).length).toBe(2);

    const dataCreate = await fastAPI.api.inject({
      method: 'POST',
      url: '/api/messages',
      payload: {
        message: 'Hello World',
        userId: 1
      }
    });

    await fastAPI.api.inject({
      method: 'PUT',
      url: '/api/messages/{1}',
      payload: {
        message: 'Changed!'
      }
    });

    const dataRoute = await fastAPI.api.inject({
      method: 'GET',
      url: '/test'
    });

    expect(onLoaded).toBe(true);
    expect(done).toBe(true);
    expect(result.dataValues.id).toEqual(1);
    expect(dataCreate.json().message).toEqual('Hello World');
    expect(dataRoute.json().message).toEqual('Hello World');
  });
});
