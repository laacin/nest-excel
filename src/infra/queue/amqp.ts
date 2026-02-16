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
    await this.ch.close();
    await this.conn.close();
  }

  async connect(url: string): Promise<void> {
    this.conn = await connect(url);
    this.ch = await this.conn.createChannel();
  }

  stopConsumers(): void {
    this.consumers.forEach(({ tag }, queue) => {
      if (!tag) return;

      void this.ch.cancel(tag).then(() => {
        const c = this.consumers.get(queue);
        if (c) this.consumers.set(queue, { ...c, tag: undefined });
      });
    });
  }

  runConsumers(): void {
    this.consumers.forEach(({ work, onErr, tag }, queue) => {
      if (tag) return;

      void (async () => {
        const { consumerTag } = await this.ch.consume(queue, (msg) => {
          if (!msg) return;

          const data = JSON.parse(msg.content.toString()) as unknown;
          void this.handleWork(msg, data, { work, onErr });
        });

        const c = this.consumers.get(queue);
        if (c) this.consumers.set(queue, { ...c, tag: consumerTag });
      })();
    });
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

    if (await this.guard()) this.runConsumers();
  }

  publish(queue: string, data: unknown): void {
    this.ch.sendToQueue(queue, Buffer.from(JSON.stringify(data)), {
      persistent: true,
    });
  }
}
