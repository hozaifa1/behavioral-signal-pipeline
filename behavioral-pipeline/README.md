# Behavioral Signal Pipeline (Mini MarkTag)

A miniature behavioral intelligence engine that captures granular user signals from any webpage in real-time, processes them through an event-driven pipeline, and classifies user intent with AI-powered segmentation.

## Architecture

```
Browser (tracker.js)
       |
       | POST /events
       v
  NestJS REST API  ──>  RabbitMQ Queue
       |                      |
       | 202 Accepted         | consume
       v                      v
  (immediate return)     Worker Process
                              |
                    ┌─────────┴─────────┐
                    v                   v
              PostgreSQL           ClickHouse
           (user profiles)      (raw analytics)
                    |                   |
                    v                   v
              POST /segment       GET /dashboard
            (LLM / rule-based)   (live analytics)
                    |                   |
                    └─────────┬─────────┘
                              v
                     React Dashboard
                    (localhost:5173)
```

## Prerequisites

- **Node.js** 20+
- **Docker Desktop** (for PostgreSQL, RabbitMQ, ClickHouse)

## How to Run

### 1. Start infrastructure

```bash
cd behavioral-pipeline
docker-compose up -d
```

This starts PostgreSQL, RabbitMQ (with management UI at http://localhost:15672), and ClickHouse.

### 2. Install dependencies and migrate

```bash
npm install
npx prisma migrate dev
```

### 3. Start the backend

```bash
npm run start:dev
```

Server runs at http://localhost:3000.

### 4. Start the React dashboard

```bash
cd ../dashboard
npm install
npm run dev
```

Dashboard runs at http://localhost:5173.

### 5. Open the demo page

Visit http://localhost:3000/demo.html — scroll, click, and interact to generate behavioral events.

## API Documentation

### POST /events

Ingests a behavioral event into the pipeline. Returns immediately after queuing.

```json
// Request
{
  "userId": "user_abc123",
  "eventType": "scroll",
  "scrollDepth": 75,
  "pageUrl": "http://example.com",
  "timestamp": 1712345678000
}

// Response (202 Accepted)
{ "status": "accepted" }
```

### POST /segment

Classifies a user's intent based on their behavioral profile.

```json
// Request
{ "userId": "user_abc123" }

// Response
{
  "intent": "high_intent",
  "confidence": 0.7,
  "recommended_channel": "sms",
  "personalized_message": "We noticed your interest! Come back and explore our latest picks."
}
```

Uses GPT-4o-mini when `OPENAI_API_KEY` is set in `.env`. Falls back to rule-based segmentation otherwise.

### GET /dashboard

Returns live analytics from ClickHouse.

```json
{
  "totalEvents": 1523,
  "byType": [
    { "eventType": "scroll", "count": 892 },
    { "eventType": "click", "count": 431 },
    { "eventType": "pageview", "count": 200 }
  ]
}
```

## Environment Variables

Create a `.env` file in the `behavioral-pipeline/` directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/behavioral_db"
RABBITMQ_URL=amqp://guest:guest@localhost:5672
CLICKHOUSE_URL=http://localhost:8123
CLICKHOUSE_PASSWORD=password
OPENAI_API_KEY=sk-proj-your-key-here   # Optional: enables LLM segmentation
```

## Tech Stack

TypeScript, NestJS, RabbitMQ, PostgreSQL, Prisma, ClickHouse, React, Vite, Docker Compose

---

## Markopolo Required Answers

**What it does:** Captures granular behavioral signals from any webpage in real-time. Events flow through a RabbitMQ queue into PostgreSQL (user profiles) and ClickHouse (raw analytics). An LLM endpoint classifies user intent and generates a personalized engagement message. A React dashboard shows live segments. This is a proof-of-concept replica of a behavioral intelligence engine built on the exact same architecture Markopolo uses at scale.

**AI tools used:** GPT-4o-mini for intent classification and personalized message generation. Structured prompt engineering to enforce reliable JSON output from the LLM. Rule-based fallback segmentation when no API key is available.

**What I learned:** How to architect an event-driven pipeline that separates ingestion (fast, high-throughput) from processing (slower, CPU-intensive) using a message queue. Why ClickHouse's columnar storage is 10-100x faster than PostgreSQL for behavioral analytics queries. How to write a non-blocking browser tracker snippet that captures micro-behavioral signals.

**What I'd improve:** Train a lightweight local model on behavioral sequences to replace the LLM API call, running client-side at under 10MB — the way ATHENA does it. Add session stitching to link anonymous visitors across page loads. Add dead-letter queue handling for failed jobs.
