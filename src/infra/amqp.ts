import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import amqp from 'amqplib';
import { QueueService } from 'src/domain/repository';

export class RabbitMQConn
  implements QueueService, OnModuleInit, OnModuleDestroy
{
  private conn: ChannelModel;
  private ch: Channel;

  async onModuleInit() {
    const conn = await amqp.connect(
      process.env.AMQP_URL ?? 'amqp://guest:guest@localhost:5672',
    );
    const ch = await conn.createChannel();
    await ch.assertQueue('jobs');
    this.conn = conn;
    this.ch = ch;
  }

  async onModuleDestroy() {
    await this.ch.close();
    await this.conn.close();
  }

  send(data: Record<string, unknown>[]): void {
    this.ch.sendToQueue('jobs', Buffer.from(JSON.stringify(data)), {
      persistent: true,
    });
  }

  async process(callback: (data: Record<string, unknown>) => Promise<void>) {
    await this.ch.consume('jobs', (msg) => {
      if (!msg) return;
      void this.handleMessage(msg, callback);
    });
  }

  private async handleMessage(
    msg: ConsumeMessage,
    callback: (data: Record<string, unknown>) => Promise<void>,
  ) {
    const data = JSON.parse(msg.content.toString()) as Record<string, unknown>;
    await callback(data);
    this.ch.ack(msg);
  }
}
