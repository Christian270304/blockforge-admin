CREATE TABLE IF NOT EXISTS modpacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,

    description TEXT,

    minecraft_version TEXT NOT NULL,

    loader TEXT NOT NULL,
    loader_version TEXT NOT NULL,

    server_address TEXT,

    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'published')),

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_modpacks_slug
ON modpacks(slug);

CREATE INDEX IF NOT EXISTS idx_modpacks_status
ON modpacks(status);