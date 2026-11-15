-- Forum comments, upvotes and reports (the API also creates these when missing: services/api/src/modules/m08-forum/service.ts)
CREATE TABLE IF NOT EXISTS m08_forum_comments (
  id VARCHAR(64) PRIMARY KEY, post_id VARCHAR(64) NOT NULL, author_id VARCHAR(255) NOT NULL,
  author_name VARCHAR(255) NOT NULL, content TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_m08_comments_post ON m08_forum_comments (post_id, created_at);
CREATE TABLE IF NOT EXISTS m08_forum_votes (
  post_id VARCHAR(64) NOT NULL, user_sub VARCHAR(255) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_sub));
CREATE TABLE IF NOT EXISTS m08_forum_reports (
  post_id VARCHAR(64) NOT NULL, user_sub VARCHAR(255) NOT NULL, reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY (post_id, user_sub));
