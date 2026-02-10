import { Module } from '@nestjs/common';
import { PERSIST } from 'src/domain/repository';
import { MongoConn } from './persist/repository';

@Module({
  imports: [],
  providers: [
    { provide: PERSIST, useClass: MongoConn },
    // { provide: QUEUE, useClass: RabbitMQConn },
  ],
  exports: [PERSIST],
})
export class InfraModule {}
