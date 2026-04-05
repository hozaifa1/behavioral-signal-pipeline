import { Controller, Post, Body } from '@nestjs/common';
import { SegmentService } from './segment.service';
import { SegmentUserDto } from './dto/segment-user.dto';

@Controller('segment')
export class SegmentController {
  constructor(private readonly segmentService: SegmentService) {}

  @Post()
  async segment(@Body() dto: SegmentUserDto) {
    return this.segmentService.segment(dto.userId);
  }
}
