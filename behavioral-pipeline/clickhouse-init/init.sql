CREATE TABLE IF NOT EXISTS behavioral_events (
    userId String,
    eventType String,
    scrollDepth Float32,
    pageUrl String,
    timestamp DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (userId, timestamp);
