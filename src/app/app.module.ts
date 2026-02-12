import { XlsxService } from './xlsx.service';
import { UseCase } from './usecases.app';
import { DynamicModule, Module } from '@nestjs/common';
import { AppConfig, BATCH_SIZE } from './config.app';

@Module({})
export class AppModule {
  static forRoot(cfg: AppConfig): DynamicModule {
    return {
      module: AppModule,
      imports: cfg.dependencies,
      providers: [
        XlsxService,
        UseCase,
        { provide: BATCH_SIZE, useValue: cfg.batchSize },
      ],
      exports: [UseCase],
    };
  }
}
