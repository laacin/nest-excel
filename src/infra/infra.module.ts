import { Module } from '@nestjs/common';
import { PERSIST, QUEUE } from 'src/domain/repository';
import { MongoConn } from './mongo';
import { RabbitMQConn } from './amqp';

@Module({
  imports: [],
  providers: [
    { provide: PERSIST, useClass: MongoConn },
    { provide: QUEUE, useClass: RabbitMQConn },
  ],
  exports: [PERSIST, QUEUE],
})
export class InfraModule {}
