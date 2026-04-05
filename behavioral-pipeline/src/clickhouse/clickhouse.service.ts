import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, ClickHouseClient } from '@clickhouse/client';

@Injectable()
export class ClickhouseService implements OnModuleInit, OnModuleDestroy {
  private client: ClickHouseClient;

  onModuleInit() {
    this.client = createClient({
      url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
      password: process.env.CLICKHOUSE_PASSWORD || 'password',
    });
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  async insertEvent(event: any) {
    let timestamp = event.timestamp;
    if (timestamp) {
      const date = new Date(timestamp);
      timestamp = date.toISOString().replace('T', ' ').substring(0, 19);
    } else {
      timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    }

    await this.client.insert({
      table: 'behavioral_events',
      values: [
        {
          userId: event.userId,
          eventType: event.eventType,
          scrollDepth: event.scrollDepth || 0,
          pageUrl: event.pageUrl || '',
          timestamp: timestamp,
        },
      ],
      format: 'JSONEachRow',
    });
  }

  async getAnalytics() {
    const rs = await this.client.query({
      query: `SELECT count() as totalEvents FROM behavioral_events`,
      format: 'JSONEachRow',
    });
    const totalEventsData: any[] = await rs.json();
    const totalEvents = totalEventsData.length > 0 ? Number(totalEventsData[0].totalEvents) : 0;

    const rsTypes = await this.client.query({
      query: `SELECT eventType, count() as count FROM behavioral_events GROUP BY eventType`,
      format: 'JSONEachRow',
    });
    const typesData: any[] = await rsTypes.json();
    const byType = typesData.map((row: any) => ({
      eventType: row.eventType,
      count: Number(row.count),
    }));

    return {
      totalEvents,
      byType,
    };
  }
}
