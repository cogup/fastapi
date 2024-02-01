import { Get, FastAPI, Builder, Reply } from '../src';
import { sequelize, schema } from './utils/message';

describe('MakeRouters', () => {
  it('Test OnLoad MakeRouters', async () => {
    class MessageRouters extends Builder {
      message?: string;

      onLoad(): void {
        this.message = 'Hello World';
      }

      @Get({
        path: '/messages/fake',
        summary: 'Get Message',
        description: 'Get Message',
        tags: ['Message'],
        responses: {
          201: {
            description: 'Get Message',
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
      async getMessage(_request: Request, reply: Reply) {
        reply.status(200).send({
          message: this.message
        });
      }
    }

    const fastAPI = new FastAPI({
      sequelize,
      schema,
      prefix: '/app',
      routes: [MessageRouters]
    });

    const data = await fastAPI.api.inject({
      method: 'GET',
      url: '/app/messages/fake'
    });

    expect(data.json()).toEqual({
      message: 'Hello World'
    });
  });
});
