import { DynamicModule, Module } from '@nestjs/common';
import { Controllers } from './controller';

interface InterfaceConfig {
  dependencies: DynamicModule[];
}

@Module({})
export class InterfaceModule {
  static forRoot(cfg: InterfaceConfig): DynamicModule {
    return {
      module: InterfaceModule,
      imports: cfg.dependencies,
      controllers: [Controllers],
    };
  }
}
