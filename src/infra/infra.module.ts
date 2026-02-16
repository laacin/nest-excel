import { DynamicModule, Module } from '@nestjs/common';
import { PERSIST, MESSAGING } from 'src/domain/repository';
import { MongoImpl } from './persist/repository';
import { RabbitMqImpl } from './queue/amqp';
import { InfraConfig } from './config';

@Module({})
export class InfraModule {
  static async forRootAsync(cfg: InfraConfig): Promise<DynamicModule> {
    const mongo = new MongoImpl();
    const amqp = new RabbitMqImpl(() => mongo.isConnected());

    await mongo.connect(cfg.mongoUrl);
    await amqp.connect(cfg.amqpUrl);

    mongo.setup({
      onConnect: () => {
        amqp.runConsumers();
        console.log('mongo up -> running consumers');
      },

      onDisconnect: () => {
        amqp.stopConsumers();
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
