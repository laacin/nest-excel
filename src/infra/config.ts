export const MONGO_URL = 'MONGO_URL';
export const AMQP_URL = 'AMQP_RUL';

export interface InfraConfig {
  mongoUrl: string;
  amqpUrl: string;
}
