import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { connect, ChannelModel, Channel, ConsumeMessage } from 'amqplib';
import { MessagingService, Consumer } from 'src/domain/repository';

@Injectable()
export class RabbitMqImpl implements OnModuleDestroy, MessagingService {
  private conn: ChannelModel;
  private ch: Channel;
  private consumers = new Map<
    string,
    Omit<Consumer, 'queue'> & { tag?: string }
  >();

  constructor(private guard: () => Promise<boolean>) {}

  async onModuleDestroy() {
    await this.stopConsumers();

    await this.ch.close();
    await this.conn.close();
  }

  async connect(url: string): Promise<void> {
    this.conn = await connect(url);
    this.ch = await this.conn.createChannel();
  }

  async stopConsumers(): Promise<void> {
    for (const [queue, { tag, ...rest }] of this.consumers) {
      if (!tag) continue;

      await this.ch.cancel(tag);
      this.consumers.set(queue, { ...rest, tag: undefined });
    }
  }

  async runConsumers(): Promise<void> {
    for (const [queue, { tag, work, onErr }] of this.consumers) {
      if (tag) continue;

      const { consumerTag } = await this.ch.consume(queue, (msg) => {
        if (!msg) return;

        const data = JSON.parse(msg.content.toString()) as unknown;
        void this.handleWork(msg, data, { work, onErr });
      });

      this.consumers.set(queue, { tag: consumerTag, work, onErr });
    }
  }

  private async handleWork(
    msg: ConsumeMessage,
    data: unknown,
    { work, onErr }: Omit<Consumer, 'queue'>,
  ): Promise<void> {
    try {
      await work(data);
      this.ch.ack(msg);
    } catch (err) {
      try {
        await onErr?.fallback?.(err, data);
      } catch {
        // end or requeue
      } finally {
        this.ch.nack(msg, false, onErr?.requeue ?? false);
      }
    }
  }

  // -- MessagingService methods
  async storeQueue(queue: string): Promise<void> {
    await this.ch.assertQueue(queue, { durable: true });
  }

  async storeConsumers(consumers: Consumer[]): Promise<void> {
    consumers.forEach(({ queue, work, onErr }) => {
      this.consumers.set(queue, { work, onErr });
    });

    if (await this.guard()) await this.runConsumers();
  }

  publish(queue: string, data: unknown): void {
    this.ch.sendToQueue(queue, Buffer.from(JSON.stringify(data)), {
      persistent: true,
    });
  }
}
