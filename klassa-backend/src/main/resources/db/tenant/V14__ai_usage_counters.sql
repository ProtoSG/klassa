CREATE TABLE ai_usage_counters (
    year_month VARCHAR(7) PRIMARY KEY,
    message_count INT NOT NULL DEFAULT 0
);
