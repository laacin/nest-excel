import { DynamicModule, Module } from '@nestjs/common';
import { AppModule } from './app/app.module';
import { InfraModule } from './infra/infra.module';
import { InterfaceModule } from './interface/interface.module';
import { ConfigModule } from '@nestjs/config';
import { AppConfig } from './app/config.app';
import { InfraConfig } from './infra/config';

export interface Configuration {
  infra?: InfraConfig;
  app?: AppConfig;
}

@Module({})
export class MainModule {
  static async forRootAsync(cfg: Configuration): Promise<DynamicModule> {
    const infra = await InfraModule.forRootAsync(cfg.infra);
    const app = AppModule.forRoot({ dependencies: [infra], ...cfg.app });
    const iface = InterfaceModule.forRoot({ dependencies: [app] });

    return {
      module: MainModule,
      imports: [ConfigModule.forRoot({ isGlobal: true }), infra, app, iface],
    };
  }
}
