-- Schema for marathon-lfg-db (D1).
-- Apply locally with: npx wrangler d1 execute marathon-lfg-db --local --file=migrations/0001_init.sql
-- Apply remotely with: npx wrangler d1 execute marathon-lfg-db --remote --file=migrations/0001_init.sql

CREATE TABLE IF NOT EXISTS lfgs (
  id                  TEXT PRIMARY KEY,
  title               TEXT NOT NULL,
  notes               TEXT NOT NULL DEFAULT '',
  capacity            INTEGER NOT NULL,
  status              TEXT NOT NULL DEFAULT 'OPEN',
  created_at          INTEGER NOT NULL,
  initiated_at        INTEGER,
  host_membership_id  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lfgs_status_created
  ON lfgs(status, created_at DESC);

CREATE TABLE IF NOT EXISTS lfg_members (
  lfg_id                  TEXT NOT NULL,
  membership_id           TEXT NOT NULL,
  display_name            TEXT NOT NULL,
  display_code            INTEGER,
  role                    TEXT NOT NULL,         -- HOST | GUEST
  status                  TEXT NOT NULL,         -- PENDING | CONFIRMED
  joined_at               INTEGER NOT NULL,
  friend_request_sent_at  INTEGER,
  friend_request_ok       INTEGER,               -- 0/1
  friend_request_error    TEXT,
  PRIMARY KEY (lfg_id, membership_id),
  FOREIGN KEY (lfg_id) REFERENCES lfgs(id) ON DELETE CASCADE
);
