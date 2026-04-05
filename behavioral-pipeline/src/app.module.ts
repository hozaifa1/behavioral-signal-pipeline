import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppController } from './app.controller';
import { EventsModule } from './events/events.module';
import { ClickhouseModule } from './clickhouse/clickhouse.module';
import { SegmentModule } from './segment/segment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({ rootPath: join(process.cwd(), 'public') }),
    EventsModule,
    ClickhouseModule,
    SegmentModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
