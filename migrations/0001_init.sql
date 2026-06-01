-- Dynamic Form Storage Structure
CREATE TABLE IF NOT EXISTS forms (
    id TEXT PRIMARY KEY NOT NULL, -- UUIDv7 format string
    name TEXT NOT NULL UNIQUE,
    user_id_format TEXT NOT NULL DEFAULT 'user_id', -- User identification format
    allow_overwrite INTEGER NOT NULL DEFAULT 0, -- Boolean proxy toggle (0 = disallowed, 1 = allowed)
    submissions_expiry INTEGER, -- UNIX timestamp for form expiry (optional)
    questions_json TEXT NOT NULL, -- Serialized JSON rules engine config
    created_at INTEGER NOT NULL -- Extracted or calculated UNIX timestamp epoch
);

CREATE INDEX IF NOT EXISTS idx_forms_name ON forms(name);

-- User Form Response Log Metrics
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY NOT NULL, -- UUIDv7 format string
    form_id TEXT NOT NULL,
    form_name TEXT NOT NULL,
    user_id TEXT NOT NULL, -- User identification key
    answers_json TEXT NOT NULL, -- Client form selection key-value pairs
    submitted_at INTEGER NOT NULL, -- Extracted epoch timestamp
    FOREIGN KEY(form_id) REFERENCES forms(id) ON DELETE CASCADE
);

-- Multilayer indexing matrices for lightning fast queries across large datasets
CREATE INDEX IF NOT EXISTS idx_submissions_form_id ON submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_form_name ON submissions(form_name);

-- Globals table for system-wide settings
CREATE TABLE IF NOT EXISTS globals (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Initialize default global settings
INSERT OR IGNORE INTO globals (key, value) VALUES ('submissions_global_enabled', 'true');