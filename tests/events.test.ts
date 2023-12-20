import {
  FastAPI,
  HandlerType,
  Model,
  SchemaModelsBuilder,
  Sequelize
} from '../src/index';
import { DataTypes } from 'sequelize';

describe('Events', () => {
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
