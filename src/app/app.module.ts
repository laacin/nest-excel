import { UseCase } from './usecases.app';
import { DynamicModule, Module } from '@nestjs/common';
import { AppConfig, BATCH_SIZE, QUEUE_NAME } from './config.app';

@Module({})
export class AppModule {
  static forRoot(cfg: AppConfig): DynamicModule {
    return {
      module: AppModule,
      imports: cfg.dependencies,
      providers: [
        UseCase,
        { provide: BATCH_SIZE, useValue: cfg.batchSize },
        { provide: QUEUE_NAME, useValue: cfg.queueName },
      ],
      exports: [UseCase],
    };
  }
}
