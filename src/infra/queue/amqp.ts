import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { connect, ChannelModel, Channel, ConsumeMessage } from 'amqplib';
import { QueueService } from 'src/domain/repository';

@Injectable()
export class RabbitMqConn
  implements OnModuleInit, OnModuleDestroy, QueueService
{
  private conn: ChannelModel;
  private ch: Channel;

  async onModuleInit() {
    const conn = await connect('amqp://guest:guest@localhost:5672');

    const ch = await conn.createChannel();
    await ch.assertQueue('xlsx.process', { durable: true });

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
  ): Promise<void> {
    await this.ch.consume(job, (msg) => {
      if (!msg) return;

      const data = msg.content.toString();
      void this.handleWork(msg, async () => {
        await work(data);
      });
    });
  }

  private async handleWork(
    msg: ConsumeMessage,
    work: () => Promise<void>,
  ): Promise<void> {
    await work();
    this.ch.ack(msg);
  }
}
