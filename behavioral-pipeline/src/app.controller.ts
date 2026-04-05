import { Controller, Get } from '@nestjs/common';
import { ClickhouseService } from './clickhouse/clickhouse.service';

@Controller()
export class AppController {
  constructor(private readonly clickhouseService: ClickhouseService) {}

  @Get()
  getHello(): string {
    return 'Behavioral Signal Pipeline API is running';
  }

  @Get('dashboard')
  async getDashboard() {
    return this.clickhouseService.getAnalytics();
  }
}
