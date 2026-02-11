import { Module } from '@nestjs/common';
import { PERSIST, QUEUE } from 'src/domain/repository';
import { MongoConn } from './persist/repository';
import { RabbitMqConn } from './queue/amqp';

@Module({
  imports: [],
  providers: [
    { provide: PERSIST, useClass: MongoConn },
    { provide: QUEUE, useClass: RabbitMqConn },
  ],
  exports: [PERSIST, QUEUE],
})
export class InfraModule {}
