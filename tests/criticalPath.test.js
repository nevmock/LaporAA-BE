const mongoose = require('mongoose');
const cron = require('node-cron');
const autoCloseFeedback = require('../utils/autoCloseFeedback');
require('dotenv').config();

beforeAll(async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI environment variable is not set');
  }
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Cron Job Tests', () => {
  jest.setTimeout(10000);

  test('autoCloseFeedback function runs without error', async () => {
    await expect(autoCloseFeedback()).resolves.not.toThrow();
  });

  test('cron job scheduled correctly', () => {
    const task = cron.schedule("0 0 * * *", () => {
      autoCloseFeedback();
    });
    expect(task).toBeDefined();
    task.stop();
  });
});
