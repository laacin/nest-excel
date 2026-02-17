import { UseCase } from './usecases.app';
import { DynamicModule, Module } from '@nestjs/common';
import { AppConfig, BATCH_SIZE, QUEUE_NAME, SHEET_CLASS } from './config.app';
import { Sheet } from './services/xlsx.service';

@Module({})
export class AppModule {
  static forRoot(cfg: AppConfig): DynamicModule {
    return {
      module: AppModule,
      imports: cfg.dependencies,
      providers: [
        UseCase,
        { provide: BATCH_SIZE, useValue: cfg.batchSize ?? 10000 },
        { provide: QUEUE_NAME, useValue: cfg.queueName ?? 'process.queue' },
        { provide: SHEET_CLASS, useValue: cfg.sheetClass ?? Sheet },
      ],
      exports: [UseCase],
    };
  }
}
