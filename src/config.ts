export interface Configuration {
  mongo?: MongoConfig;
  amqp?: RabbitMQConfig;
  app?: AppConfig;
}

interface MongoConfig {
  host: string;
  port: number;
  db: string;
  user?: string;
  pass?: string;
}

interface RabbitMQConfig {
  host: string;
  port: number;
  user?: string;
  pass?: string;
}

interface AppConfig {
  readBatchSize?: number;
  processBatchSize?: number;
  readJobName?: string;
  processJobName?: string;
}

// defaults
const DEFAULT_APP: Required<AppConfig> = {
  readBatchSize: 10000,
  processBatchSize: 10000,
  readJobName: 'job.upload',
  processJobName: 'job.process',
};

const DEFAULT_MONGO: MongoConfig = {
  host: 'localhost',
  port: 27017,
  db: 'mydb',
};

const DEFAULT_AMQP: RabbitMQConfig = {
  host: 'localhost',
  port: 5672,
  user: 'guest',
  pass: 'guest',
};

// resolved
interface ResolvedConfig {
  appCfg: Required<AppConfig>;
  mongoUrl: string;
  amqpUrl: string;
}

export const resolveConfig = (cfg: Configuration): ResolvedConfig => {
  const appCfg: Required<AppConfig> = cfg.app
    ? {
        readBatchSize: cfg.app.readBatchSize ?? DEFAULT_APP.readBatchSize,
        processBatchSize:
          cfg.app.processBatchSize ?? DEFAULT_APP.processBatchSize,
        readJobName: cfg.app.readJobName ?? DEFAULT_APP.readJobName,
        processJobName: cfg.app.processJobName ?? DEFAULT_APP.processJobName,
      }
    : DEFAULT_APP;

  const mongo = cfg.mongo ?? DEFAULT_MONGO;
  const mongoUrl = mongo.user
    ? `mongodb://${mongo.user}:${mongo.pass}@${mongo.host}:${mongo.port}/${mongo.db}`
    : `mongodb://${mongo.host}:${mongo.port}/${mongo.db}`;

  const amqp = cfg.amqp ?? DEFAULT_AMQP;
  const amqpUrl = `amqp://${amqp.user}:${amqp.pass}@${amqp.host}:${amqp.port}`;

  return {
    appCfg,
    mongoUrl,
    amqpUrl,
  };
};
