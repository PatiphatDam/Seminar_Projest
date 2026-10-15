-- Test builder blocks (Google Forms style) and uploaded images.
--   questions.type gains 'text' (title + description), 'image' (picture + caption) and 'section' (starts a new page).
--   These blocks have no answer and 0 points; grading skips them.
--   questions.description holds the description of text / section blocks.
-- SQLite can't change a CHECK constraint in place, so the table is rebuilt (ids are kept).

PRAGMA defer_foreign_keys = true;

CREATE TABLE questions_new (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id     INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL,
  type        TEXT    NOT NULL CHECK (type IN ('single', 'multi', 'truefalse', 'short', 'text', 'image', 'section')),
  prompt      TEXT    NOT NULL,
  description TEXT    NOT NULL DEFAULT '',
  image_url   TEXT,
  options     TEXT    NOT NULL DEFAULT '[]',
  answer      TEXT    NOT NULL,
  points      INTEGER NOT NULL DEFAULT 1,
  required    INTEGER NOT NULL DEFAULT 1
);

INSERT INTO questions_new (id, test_id, position, type, prompt, description, image_url, options, answer, points, required)
  SELECT id, test_id, position, type, prompt, '', image_url, options, answer, points, required FROM questions;

DROP TABLE questions;
ALTER TABLE questions_new RENAME TO questions;
CREATE INDEX idx_questions_test ON questions(test_id, position);

-- Images uploaded from the test builder (resized in the browser to ≤ 1600 px before upload).
CREATE TABLE images (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  mime        TEXT    NOT NULL CHECK (mime IN ('image/webp', 'image/jpeg', 'image/png', 'image/gif')),
  data        BLOB    NOT NULL,
  size        INTEGER NOT NULL,
  admin_email TEXT    NOT NULL,
  created_at  TEXT    NOT NULL
);
