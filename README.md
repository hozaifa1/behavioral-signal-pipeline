# Behavioral Signal Pipeline

> **What it does:** Captures granular behavioral signals from any webpage in real-time. Events flow through a RabbitMQ queue into PostgreSQL (user profiles) and ClickHouse (raw analytics). An LLM endpoint classifies user intent and generates a personalized engagement message. A React dashboard shows live segments. This is a proof-of-concept replica of a behavioral intelligence engine built on the exact same architecture Markopolo uses at scale.

> **AI tools used:** GPT-4o-mini for intent classification and personalized message generation. Structured prompt engineering to enforce reliable JSON output from the LLM.

> **What I learned:** How to architect an event-driven pipeline that separates ingestion (fast, high-throughput) from processing (slower, CPU-intensive) using a message queue. Why ClickHouse's columnar storage is 10-100x faster than PostgreSQL for behavioral analytics queries. How to write a non-blocking browser tracker snippet that captures micro-behavioral signals.

> **What I'd improve:** Train a lightweight local model on behavioral sequences to replace the LLM API call, running client-side at under 10MB — the way ATHENA does it. Add session stitching to link anonymous visitors across page loads. Add dead-letter queue handling for failed jobs.
