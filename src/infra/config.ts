export const MONGO_URL = 'MONGO_URL';
export const AMQP_URL = 'AMQP_RUL';

export interface InfraConfig {
  mongo?: MongoConfig;
  amqp?: RabbitMQConfig;
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

export const resolveCfg = (cfg?: InfraConfig) => {
  const mongo = cfg?.mongo ?? DEFAULT_MONGO;
  const mongoUrl = mongo.user
    ? `mongodb://${mongo.user}:${mongo.pass}@${mongo.host}:${mongo.port}/${mongo.db}`
    : `mongodb://${mongo.host}:${mongo.port}/${mongo.db}`;

  const amqp = cfg?.amqp ?? DEFAULT_AMQP;
  const amqpUrl = `amqp://${amqp.user}:${amqp.pass}@${amqp.host}:${amqp.port}`;

  return { mongoUrl, amqpUrl } as const;
};
