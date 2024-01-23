import { FastAPI } from '../src';
import { sequelize, schema } from './utils/message';

describe('Relationship', () => {
  it('Test Relationship', async () => {
    await sequelize.sync({ force: true });

    const fastAPI = new FastAPI({
      sequelize,
      schema
    });

    const createAuthor = await fastAPI.api.inject({
      method: 'POST',
      url: '/api/authors',
      payload: {
        name: 'John Doe'
      }
    });

    expect(createAuthor.json().name).toEqual('John Doe');

    const createMessage = await fastAPI.api.inject({
      method: 'POST',
      url: '/api/messages',
      payload: {
        message: 'Hello World',
        authorId: 1
      }
    });

    expect(createMessage.json().message).toEqual('Hello World');

    const listMessages = await fastAPI.api.inject({
      method: 'GET',
      url: '/api/messages'
    });

    expect(listMessages.json().data[0].author.id).toEqual(1);
  });
});
