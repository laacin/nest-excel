import { DynamicModule, Module } from '@nestjs/common';
import { Controllers } from './controller.adapter';

interface AdapterConfig {
  dependencies: DynamicModule[];
}

@Module({})
export class AdapterModule {
  static forRoot(cfg: AdapterConfig): DynamicModule {
    return {
      module: AdapterModule,
      imports: cfg.dependencies,
      controllers: [Controllers],
    };
  }
}
