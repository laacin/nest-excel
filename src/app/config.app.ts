import { DynamicModule } from '@nestjs/common';

// tokens
export const READ_BATCH_SIZE = 'READ_BATCH_SIZE';
export const PROCESS_BATCH_SIZE = 'PROCESS_BATCH_SIZE';

export const READ_JOB_NAME = 'READ_JOB_NAME';
export const PROCESS_JOB_NAME = 'PROCESS_JOB_NAME';

// config
export interface AppConfig {
  dependencies: DynamicModule[];
  readBatchSize: number;
  processBatchSize: number;
  readJobName: string;
  processJobName: string;
}
