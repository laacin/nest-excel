import { DynamicModule, Module } from '@nestjs/common';
import { PERSIST, MESSAGING } from 'src/domain/repository';
import { MongoImpl } from './persist/repository';
import { RabbitMqImpl } from './queue/amqp';
import { InfraConfig, resolveCfg } from './config';

@Module({})
export class InfraModule {
  static async forRootAsync(cfg?: InfraConfig): Promise<DynamicModule> {
    const mongo = new MongoImpl();
    const amqp = new RabbitMqImpl(() => mongo.isConnected());

    const { mongoUrl, amqpUrl } = resolveCfg(cfg);

    await mongo.connect(mongoUrl);
    await amqp.connect(amqpUrl);

    mongo.setup({
      onConnect: () => {
        void amqp.runConsumers();
        console.log('mongo up -> running consumers');
      },

      onDisconnect: () => {
        void amqp.stopConsumers();
        console.log('mongo down -> stopping consumers');
      },
    });

    return {
      module: InfraModule,
      providers: [
        { provide: PERSIST, useValue: mongo },
        { provide: MESSAGING, useValue: amqp },
      ],
      exports: [PERSIST, MESSAGING],
    };
  }
}
