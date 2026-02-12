import { XlsxService } from './xlsx.service';
import { UseCase } from './usecases.app';
import { DynamicModule, Module } from '@nestjs/common';
import {
  AppConfig,
  PROCESS_BATCH_SIZE,
  PROCESS_JOB_NAME,
  READ_BATCH_SIZE,
  READ_JOB_NAME,
} from './config.app';

@Module({})
export class AppModule {
  static forRoot(cfg: AppConfig): DynamicModule {
    return {
      module: AppModule,
      imports: cfg.dependencies,
      providers: [
        XlsxService,
        UseCase,
        { provide: READ_BATCH_SIZE, useValue: cfg.readBatchSize },
        { provide: PROCESS_BATCH_SIZE, useValue: cfg.processBatchSize },
        { provide: READ_JOB_NAME, useValue: cfg.readJobName },
        { provide: PROCESS_JOB_NAME, useValue: cfg.processJobName },
      ],
      exports: [UseCase],
    };
  }
}
