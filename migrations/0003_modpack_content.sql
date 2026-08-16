-- ============================================================
-- MODPACK VERSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS modpack_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    modpack_id INTEGER NOT NULL,

    version TEXT NOT NULL,

    minecraft_version TEXT NOT NULL,

    loader TEXT NOT NULL,
    loader_version TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'draft',

    changelog TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (modpack_id)
        REFERENCES modpacks(id)
        ON DELETE CASCADE,

    UNIQUE(modpack_id, version)
);


CREATE INDEX IF NOT EXISTS idx_modpack_versions_modpack
ON modpack_versions(modpack_id);


-- ============================================================
-- MODS
-- ============================================================

CREATE TABLE IF NOT EXISTS mods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    modpack_version_id INTEGER NOT NULL,

    name TEXT NOT NULL,
    filename TEXT NOT NULL,

    source TEXT NOT NULL,

    project_id TEXT,
    version_id TEXT,

    download_url TEXT,

    required INTEGER NOT NULL DEFAULT 1,

    sha256 TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (modpack_version_id)
        REFERENCES modpack_versions(id)
        ON DELETE CASCADE
);


CREATE INDEX IF NOT EXISTS idx_mods_version
ON mods(modpack_version_id);


-- ============================================================
-- EXTRA FILES
-- ============================================================

CREATE TABLE IF NOT EXISTS modpack_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    modpack_version_id INTEGER NOT NULL,

    path TEXT NOT NULL,
    filename TEXT NOT NULL,

    download_url TEXT NOT NULL,

    sha256 TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (modpack_version_id)
        REFERENCES modpack_versions(id)
        ON DELETE CASCADE,

    UNIQUE(modpack_version_id, path)
);