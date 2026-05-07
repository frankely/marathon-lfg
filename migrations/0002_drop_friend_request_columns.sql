-- Drop the dead friend_request_* columns on lfg_members.
--
-- These were added when we expected to fire bungie.net friend requests
-- server-side. The Bungie API requires the BnetWrite OAuth scope for
-- POST /Social/Friends/Add, which Bungie's own OpenAPI spec describes as
-- "reserved for Bungie.net elevated scope: not meant to be used by third
-- party applications." The host now adds Runners manually via a deep-link
-- to each guest's bungie.net profile, so these columns are never written.
--
-- D1 (SQLite >= 3.35) supports ALTER TABLE DROP COLUMN, so no rebuild
-- dance is needed. The columns aren't part of the primary key or any
-- index, so the drop is straightforward.
--
-- Apply locally:  npx wrangler d1 migrations apply marathon-lfg-db --local
-- Apply remotely: npx wrangler d1 migrations apply marathon-lfg-db --remote
--                 (or just push to main — CI runs this on deploy)

ALTER TABLE lfg_members DROP COLUMN friend_request_sent_at;
ALTER TABLE lfg_members DROP COLUMN friend_request_ok;
ALTER TABLE lfg_members DROP COLUMN friend_request_error;
