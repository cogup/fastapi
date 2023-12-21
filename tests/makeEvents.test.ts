import { emitAction, getEventsStorage } from '../src/resources/events';
import { FastAPI, OnCreate, OnEvent, Builder } from '../src';
import { sequelize, schema, Message } from './utils/message';

describe('MakeEvents', () => {
  it('Test OnLoad MakeEvents', async () => {
    let result: any = null;
    let onLoaded = false;
    let done = false;

    class MessageEvents extends Builder {
      onLoad(): void {
        onLoaded = true;
      }

      @OnCreate(Message)
      async getMessage(err: any, data: any) {
        if (err) {
          throw err;
        }

        result = data;
        emitAction(Message, 'done', null, true);
      }

      @OnEvent(Message, 'done')
      async done(_err: any, data: boolean) {
        done = data;
      }
    }

    const fastAPI = new FastAPI({
      sequelize,
      schema,
      events: [MessageEvents]
    });

    await fastAPI.sequelize?.sync();

    const eventsStorage = getEventsStorage();
    expect(Object.keys(eventsStorage).length).toBe(2);

    const data = await fastAPI.api.inject({
      method: 'POST',
      url: '/api/messages',
      payload: {
        message: 'Hello World',
        userId: 1
      }
    });

    expect(onLoaded).toBe(true);
    expect(done).toBe(true);
    expect(result.dataValues.id).toEqual(data.json().id);
  });
});
