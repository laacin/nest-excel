import { DynamicModule } from '@nestjs/common';

// tokens
export const BATCH_SIZE = 'BATCH_SIZE';
export const QUEUE_NAME = 'QUEUE_NAME';

// config
export interface AppConfig {
  dependencies: DynamicModule[];
  batchSize: number;
  queueName: string;
}
