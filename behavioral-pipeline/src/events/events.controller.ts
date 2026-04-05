import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { EventsService } from './events.service';
import { QueueEventDto } from './dto/queue-event.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @HttpCode(202)
  async queueEvent(@Body() dto: QueueEventDto) {
    return this.eventsService.queueEvent(dto);
  }
}
