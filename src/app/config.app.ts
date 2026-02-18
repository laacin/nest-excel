import { DynamicModule } from '@nestjs/common';
import { ISheetConstructor, Sheet } from './services/xlsx.service';

// tokens
export const BATCH_SIZE = 'BATCH_SIZE';
export const QUEUE_NAMES = 'QUEUE_NAMES';
export const SHEET_CLASS = 'SHEET_CLASS';

// config
export interface AppConfig {
  dependencies?: DynamicModule[];
  batchSize?: number;
  queue?: QueueNames;
  sheetClass?: ISheetConstructor;
}

export interface QueueNames {
  process: string;
}

const DEFAULT: Required<Omit<AppConfig, 'dependencies'>> = {
  batchSize: 10000,
  sheetClass: Sheet,
  queue: { process: 'process.queue' },
};

export const resolveCfg = (cfg?: AppConfig): Required<AppConfig> => {
  return {
    dependencies: cfg?.dependencies ?? [],
    batchSize: cfg?.batchSize ?? DEFAULT.batchSize,
    sheetClass: cfg?.sheetClass ?? DEFAULT.sheetClass,
    queue: cfg?.queue ?? DEFAULT.queue,
  };
};
