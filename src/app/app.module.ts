import { JobProcessingUseCase } from './usecases.app';
import { DynamicModule, Module } from '@nestjs/common';
import {
  AppConfig,
  BATCH_SIZE,
  QUEUE_NAMES,
  resolveCfg,
  SHEET_CLASS,
} from './config.app';

@Module({})
export class AppModule {
  static forRoot(cfg: AppConfig): DynamicModule {
    const { batchSize, queue, sheetClass } = resolveCfg(cfg);

    return {
      module: AppModule,
      imports: cfg.dependencies,
      providers: [
        JobProcessingUseCase,
        { provide: BATCH_SIZE, useValue: batchSize },
        { provide: QUEUE_NAMES, useValue: queue },
        { provide: SHEET_CLASS, useValue: sheetClass },
      ],
      exports: [JobProcessingUseCase],
    };
  }
}
