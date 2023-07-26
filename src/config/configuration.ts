export default () => ({
  port: parseInt(process.env.PORT) || 3000,
  logs: {
    console: {
      enabled: process.env.LOG_CONSOLE_IS_ON === 'true',
      level: process.env.LOG_CONSOLE_LEVEL || 'silly',
    },
    loki: {
      enabled: process.env.LOG_LOKI_IS_ON === 'true',
      level: process.env.LOG_LOKI_LEVEL || 'silly',
      user: process.env.LOG_LOKI_USER,
      apiKey: process.env.LOG_LOKI_API_KEY,
      pod: process.env.LOG_LOKI_POD,
    },
    sentry: {
      enabled: process.env.LOG_LOKI_IS_ON === 'true',
      level: process.env.LOG_CONSOLE_LEVEL || 'silly',
      user: process.env.LOG_LOKI_USER,
    },
  },
  vk: {
    apiKey: process.env.POKEMEON_KEY,
    longPoll: process.env.VK_BOT_POLLING_IS_ON === 'true',
    webhook: process.env.VK_BOT_WEBHOOK_IS_ON === 'true',
    replay: process.env.VK_BOT_REPLY_IS_ON === 'true',
  },
  gpt: {
    apiKey: process.env.GPT_API_KEY,
    moc: process.env.GPT_MOC === 'true',
  },
  gql: {
    apiKey: process.env.POKEMEON_KEY,
  },
});
