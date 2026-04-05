import { Injectable } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { QueueEventDto } from './dto/queue-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async queueEvent(dto: QueueEventDto): Promise<{ status: string }> {
    await this.rabbitMQService.publish('behavioral_events', dto);
    return { status: 'accepted' };
  }
}
