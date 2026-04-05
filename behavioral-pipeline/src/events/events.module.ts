import { Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventsWorker } from './events.worker';
import { ClickhouseModule } from '../clickhouse/clickhouse.module';

@Module({
  imports: [ClickhouseModule],
  controllers: [EventsController],
  providers: [RabbitMQService, EventsService, EventsWorker],
})
export class EventsModule {}
