import { DynamicModule, Module } from '@nestjs/common';
import { PERSIST, MESSAGING } from '@domain/repository';
import { MongoImpl } from '@infra/persist/repository';
import { RabbitMqImpl } from '@infra/queue/amqp';
import { InfraConfig, resolveCfg } from '@infra/config';

@Module({})
export class InfraModule {
  static async forRootAsync(cfg?: InfraConfig): Promise<DynamicModule> {
    const mongo = new MongoImpl();
    const amqp = new RabbitMqImpl(() => mongo.isConnected());

    const { mongoUrl, amqpUrl } = resolveCfg(cfg);

    await retryConn('MongoDB', 5, false, () => mongo.connect(mongoUrl));
    await retryConn('RabbitMQ', 5, true, () => amqp.connect(amqpUrl));

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

const retryConn = async (
  name: string,
  tries: number,
  fatal: boolean,
  method: () => Promise<void>,
) => {
  for (let i = 0; i < tries; i++) {
    try {
      await method();

      console.log(`connected to ${name}`);
      return;
    } catch (err) {
      if (i === tries - 1) console.log(err);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  if (fatal) throw new Error(`failed to connect to ${name}`);
  console.log(`failed to connect to ${name}`);
};
