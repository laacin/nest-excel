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
export class RabbitMqConn
  implements OnModuleInit, OnModuleDestroy, QueueService
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

  publish(job: string, data: string): void {
    this.ch.sendToQueue(job, Buffer.from(data), {
      persistent: true,
    });
  }

  async consumer(
    job: string,
    work: (data: string) => Promise<void>,
    onErr?: OnConsumerErr,
  ): Promise<void> {
    await this.ch.consume(job, (msg) => {
      if (!msg) return;

      const data = msg.content.toString();
      void this.handleWork(msg, work, data, onErr);
    });
  }

  private async handleWork<T>(
    msg: ConsumeMessage,
    work: (data: T) => Promise<void>,
    data: T,
    onErr?: OnConsumerErr,
  ): Promise<void> {
    try {
      await work(data);
      this.ch.ack(msg);
    } catch (e) {
      await onErr?.callback?.(e);
      this.ch.nack(msg, false, onErr?.requeue);
    }
  }
}
