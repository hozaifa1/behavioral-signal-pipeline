import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.close();
  }

  private async connect() {
    const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue('behavioral_events', { durable: true });
      this.logger.log('RabbitMQService connected, queue "behavioral_events" asserted');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  async publish(queueName: string, data: object): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }
    const buffer = Buffer.from(JSON.stringify(data));
    this.channel.sendToQueue(queueName, buffer, { persistent: true });
  }

  getChannel(): amqp.Channel | null {
    return this.channel;
  }

  private async close() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection', error);
    }
  }
}
