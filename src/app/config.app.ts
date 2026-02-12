import { DynamicModule } from '@nestjs/common';

// tokens
export const BATCH_SIZE = 'BATCH_SIZE';

// config
export interface AppConfig {
  dependencies: DynamicModule[];
  batchSize: number;
}
