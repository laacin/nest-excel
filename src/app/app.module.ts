import { JobProcessingUseCase } from '@app/usecases/job-processing.usecase';
import { DynamicModule, Module } from '@nestjs/common';
import { AppConfig, resolveCfg } from '@app/config';
import { BATCH_SIZE, QUEUE_NAMES, SHEET_CLASS } from '@app/constants';

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
