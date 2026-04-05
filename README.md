# Behavioral Signal Pipeline

A miniature version of a behavioral intelligence system that captures granular behavioral signals from any webpage in real-time.

## What It Does

This pipeline captures behavioral events from webpages (scroll depth, click positions, hover duration, exit intent) and processes them through an event-driven architecture:

1. **JS Tracker Snippet** - Embeds on any webpage and fires behavioral events
2. **NestJS REST API** - Receives events and publishes to RabbitMQ immediately, returning 202 Accepted
3. **RabbitMQ** - Holds events in a queue so the API never blocks
4. **Worker** - Consumes the queue and writes to:
   - **PostgreSQL** - Upserts user behavioral profiles
   - **ClickHouse** - Appends every raw event for analytics
5. **LLM Endpoint** - Reads user profiles and uses GPT-4o-mini to classify intent and generate personalized messages
6. **React Dashboard** - Shows live event counts and segment distribution
7. **Docker Compose** - Starts all infrastructure with one command

## Architecture

- **TypeScript** · **NestJS** · **RabbitMQ** · **PostgreSQL** · **ClickHouse** · **OpenAI API**
- Event-driven pipeline separating ingestion (fast, high-throughput) from processing
- ClickHouse's columnar storage for 10-100x faster analytics queries
- Non-blocking browser tracker capturing micro-behavioral signals

## Quick Start

```bash
# Start infrastructure
docker-compose up -d

# Install dependencies and run
npm install
npm run start:dev
```

## Project Structure

```
behavioral-pipeline/
├── src/               # NestJS application source
├── prisma/            # Database schema
├── clickhouse-init/   # ClickHouse initialization
├── public/            # Static assets including tracker.js
├── docker-compose.yml # Infrastructure setup
└── README.md          # This file
```

## License

MIT
