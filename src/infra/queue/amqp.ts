import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { connect, ChannelModel, Channel, ConsumeMessage } from 'amqplib';
import { OnConsumerErr, QueueService } from 'src/domain/repository';
import { AMQP_URL } from '../config';

@Injectable()
export class RabbitMqConn<T>
  implements OnModuleInit, OnModuleDestroy, QueueService<T>
{
  private conn: ChannelModel;
  private ch: Channel;

  constructor(@Inject(AMQP_URL) private readonly url: string) {}

  async onModuleInit() {
    const conn = await connect(this.url);
    const ch = await conn.createChannel();

    this.ch = ch;
    this.conn = conn;
  }

  async onModuleDestroy() {
    await this.ch.close();
    await this.conn.close();
  }

  // -- Methods
  async newJob(job: string): Promise<void> {
    await this.ch.assertQueue(job, { durable: true });
  }

  publish(job: string, data: T): void {
    this.ch.sendToQueue(job, Buffer.from(JSON.stringify(data)), {
      persistent: true,
    });
  }

  async consumer(
    job: string,
    work: (data: T) => Promise<void>,
    onErr?: OnConsumerErr<T>,
  ): Promise<void> {
    await this.ch.consume(job, (msg) => {
      if (!msg) return;

      const data = JSON.parse(msg.content.toString()) as T;
      void this.handleWork(msg, work, data, onErr);
    });
  }

  private async handleWork(
    msg: ConsumeMessage,
    work: (data: T) => Promise<void>,
    data: T,
    onErr?: OnConsumerErr<T>,
  ): Promise<void> {
    try {
      await work(data);
      this.ch.ack(msg);
    } catch (e) {
      try {
        await onErr?.fallback?.(e, data);
      } finally {
        this.ch.nack(msg, false, onErr?.requeue ?? false);
      }
    }
  }
}
