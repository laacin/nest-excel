import { DynamicModule, Module } from '@nestjs/common';
import { AppModule } from './app/app.module';
import { InfraModule } from './infra/infra.module';
import { InterfaceModule } from './interface/interface.module';
import { ConfigModule } from '@nestjs/config';
import { Configuration, resolveConfig } from './config';

@Module({})
export class MainModule {
  static async forRootAsync(cfg: Configuration): Promise<DynamicModule> {
    const { appCfg, mongoUrl, amqpUrl } = resolveConfig(cfg);

    const infra = await InfraModule.forRootAsync({ mongoUrl, amqpUrl });
    const app = AppModule.forRoot({ dependencies: [infra], ...appCfg });
    const iface = InterfaceModule.forRoot({ dependencies: [app] });

    return {
      module: MainModule,
      imports: [ConfigModule.forRoot({ isGlobal: true }), infra, app, iface],
    };
  }
}
