import { DynamicModule, Module } from '@nestjs/common';
import { AppModule } from './app/app.module';
import { InfraModule } from './infra/infra.module';
import { ConfigModule } from '@nestjs/config';
import { AppConfig } from './app/config.app';
import { InfraConfig } from './infra/config';
import { AdapterModule } from './adapter/adapter.module';

export interface Configuration {
  infra?: InfraConfig;
  app?: AppConfig;
}

@Module({})
export class MainModule {
  static async forRootAsync(cfg: Configuration): Promise<DynamicModule> {
    const infra = await InfraModule.forRootAsync(cfg.infra);
    const app = AppModule.forRoot({ dependencies: [infra], ...cfg.app });
    const adapter = AdapterModule.forRoot({ dependencies: [app] });

    return {
      module: MainModule,
      imports: [ConfigModule.forRoot({ isGlobal: true }), infra, app, adapter],
    };
  }
}
