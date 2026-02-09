import type { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import amqp from 'amqplib';
import { QueueService } from 'src/domain/repository';

export class RabbitMQConn implements QueueService {
  private conn: ChannelModel;
  private ch: Channel;

  async connect(url: string): Promise<void> {
    const conn = await amqp.connect(url);
    const ch = await conn.createChannel();
    await ch.assertQueue('jobs');
    this.conn = conn;
    this.ch = ch;
  }

  async close(): Promise<void> {
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
