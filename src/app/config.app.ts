import { DynamicModule } from '@nestjs/common';
import { ISheetConstructor } from './services/xlsx.service';

// tokens
export const BATCH_SIZE = 'BATCH_SIZE';
export const QUEUE_NAME = 'QUEUE_NAME';
export const SHEET_CLASS = 'SHEET_CLASS';

// config
export interface AppConfig {
  dependencies?: DynamicModule[];
  batchSize?: number;
  queueName?: string;
  sheetClass?: ISheetConstructor;
}
