import { DynamicModule, Module } from '@nestjs/common';
import { PERSIST, QUEUE } from 'src/domain/repository';
import { MongoConn } from './persist/repository';
import { RabbitMqConn } from './queue/amqp';
import { InfraConfig, MONGO_URL, AMQP_URL } from './config';

@Module({})
export class InfraModule {
  static forRoot(cfg: InfraConfig): DynamicModule {
    return {
      module: InfraModule,
      providers: [
        { provide: PERSIST, useClass: MongoConn },
        { provide: QUEUE, useClass: RabbitMqConn },
        { provide: AMQP_URL, useValue: cfg.amqpUrl },
        { provide: MONGO_URL, useValue: cfg.mongoUrl },
      ],
      exports: [PERSIST, QUEUE, MONGO_URL, AMQP_URL],
    };
  }
}
