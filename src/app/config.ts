import { DynamicModule } from '@nestjs/common';
import { ISheetConstructor, Sheet } from '@app/services/xlsx.service';

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
