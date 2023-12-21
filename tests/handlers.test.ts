import { Create, FastAPI, Reply, builder } from '../src';
import { sequelize, schema, Message } from './utils/message';

describe('MakeHandlers', () => {
  it('Test OnLoad MakeHandlers', async () => {
    @builder
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    class MessageHandlers {
      message?: string;

      onLoad(): void {
        this.message = 'Hello World';
      }

      @Create(Message)
      async getMessage(_request: Request, reply: Reply) {
        reply.status(201).send({
          message: this.message
        });
      }
    }

    const fastAPI = new FastAPI({
      sequelize,
      schema
    });

    const data = await fastAPI.api.inject({
      method: 'POST',
      url: '/api/messages',
      payload: {
        message: 'Hello World',
        userId: 1
      }
    });

    expect(data.json()).toEqual({
      message: 'Hello World'
    });
  });
});
