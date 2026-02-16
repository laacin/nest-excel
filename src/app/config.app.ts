import { DynamicModule } from '@nestjs/common';

export const QUEUE_NAME = 'queue.name';

// tokens
export const BATCH_SIZE = 'BATCH_SIZE';

// config
export interface AppConfig {
  dependencies: DynamicModule[];
  batchSize: number;
}
