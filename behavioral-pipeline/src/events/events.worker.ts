import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { QueueEventDto } from './dto/queue-event.dto';
import { ClickhouseService } from '../clickhouse/clickhouse.service';

@Injectable()
export class EventsWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsWorker.name);
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private prisma: PrismaClient;

  constructor(private readonly clickhouseService: ClickhouseService) {
    this.prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
  }

  async onModuleInit() {
    await this.startConsuming();
  }

  async onModuleDestroy() {
    try {
      await this.prisma.$disconnect();
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
    } catch (error) {
      this.logger.error('Error closing EventsWorker', error);
    }
  }

  private async startConsuming() {
    const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue('behavioral_events', { durable: true });
      await this.channel.prefetch(1);

      this.logger.log('EventsWorker started, consuming "behavioral_events"...');

      this.channel.consume(
        'behavioral_events',
        async (msg) => {
          if (!msg) return;
          try {
            const dto: QueueEventDto = JSON.parse(msg.content.toString());
            await this.processEvent(dto);
            this.channel!.ack(msg);
          } catch (error) {
            this.logger.error('Error processing event from queue', error);
            this.channel!.nack(msg, false, false);
          }
        },
        { noAck: false },
      );
    } catch (error) {
      this.logger.error('EventsWorker failed to start', error);
      throw error;
    }
  }

  private async processEvent(dto: QueueEventDto): Promise<void> {
    this.logger.log(`Processing event from queue... userId=${dto.userId} type=${dto.eventType}`);

    const scrollDepth = dto.scrollDepth || 0;

    await this.prisma.userProfile.upsert({
      where: { userId: dto.userId },
      update: {
        sessions: { increment: 1 },
        avgScroll: scrollDepth,
      },
      create: {
        userId: dto.userId,
        sessions: 1,
        avgScroll: scrollDepth,
      },
    });

    await this.prisma.rawEvent.create({
      data: {
        userId: dto.userId,
        eventType: dto.eventType,
        scrollDepth: scrollDepth,
        pageUrl: dto.pageUrl,
        timestamp: new Date(dto.timestamp),
      },
    });

    await this.clickhouseService.insertEvent(dto);
  }
}
