-- Ownership for many instructors (docs/ARCHITECTURE.md §7.1, decisions A–C).
--
-- B) Section numbers may repeat across instructors: UNIQUE(academic_year, semester, section) becomes
--    UNIQUE(owner_email, academic_year, semester, section). SQLite can't change a constraint in place, and dropping
--    `classes` runs its ON DELETE CASCADE actions (verified locally: it empties enrollments, assignments, rosters and
--    therefore attempts). So the dependent rows are copied aside first and put back with the same ids afterwards.
-- A) tests.owner_email: the instructor who created the test (NULL = unowned, e.g. tests made before this).
-- C) admin_login_attempts.username: the password sign-in lock counts failures per IP + username.

PRAGMA defer_foreign_keys = true;

-- 1. Copy everything that depends on classes (directly or through enrollments / assignments).
CREATE TABLE bak_enrollments AS SELECT * FROM enrollments;
CREATE TABLE bak_test_assignments AS SELECT * FROM test_assignments;
CREATE TABLE bak_class_roster AS SELECT * FROM class_roster;
CREATE TABLE bak_attempts AS SELECT * FROM attempts;
CREATE TABLE bak_enrollment_progress AS SELECT * FROM enrollment_progress;

-- 2. Rebuild classes with the per-instructor unique rule.
CREATE TABLE classes_new (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  academic_year       INTEGER NOT NULL,
  semester            INTEGER NOT NULL CHECK (semester IN (1, 2, 3)),
  section             INTEGER NOT NULL,
  name                TEXT    NOT NULL,             -- display, e.g. "2569/1 · Section 1 · Keerakarn"
  join_code           TEXT    NOT NULL UNIQUE,
  restrict_to_roster  INTEGER NOT NULL DEFAULT 0,
  status              TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at          TEXT    NOT NULL,
  archived_at         TEXT,
  owner_email         TEXT,                         -- NULL = made before owners were recorded
  UNIQUE (owner_email, academic_year, semester, section)
);
INSERT INTO classes_new (id, academic_year, semester, section, name, join_code, restrict_to_roster, status, created_at, archived_at, owner_email)
  SELECT id, academic_year, semester, section, name, join_code, restrict_to_roster, status, created_at, archived_at, owner_email FROM classes;
DROP TABLE classes;
ALTER TABLE classes_new RENAME TO classes;
CREATE INDEX idx_classes_owner ON classes(owner_email, status);

-- 3. Put the dependent rows back (same ids), parents before children.
INSERT INTO enrollments (id, student_id, class_id, status, joined_at, withdrawn_at)
  SELECT id, student_id, class_id, status, joined_at, withdrawn_at FROM bak_enrollments WHERE id NOT IN (SELECT id FROM enrollments);
INSERT INTO test_assignments (id, test_id, class_id, time_limit_min, max_attempts, score_policy, availability, is_open, opens_at, closes_at,
                              show_answers, required_first, created_at, updated_at)
  SELECT id, test_id, class_id, time_limit_min, max_attempts, score_policy, availability, is_open, opens_at, closes_at,
         show_answers, required_first, created_at, updated_at FROM bak_test_assignments WHERE id NOT IN (SELECT id FROM test_assignments);
INSERT OR IGNORE INTO class_roster (class_id, student_code, first_name)
  SELECT class_id, student_code, first_name FROM bak_class_roster;
INSERT INTO attempts (id, enrollment_id, assignment_id, test_version_id, started_at, deadline_at, submitted_at, answers, score, max_score, auto_submitted)
  SELECT id, enrollment_id, assignment_id, test_version_id, started_at, deadline_at, submitted_at, answers, score, max_score, auto_submitted
    FROM bak_attempts WHERE id NOT IN (SELECT id FROM attempts);
INSERT OR IGNORE INTO enrollment_progress (enrollment_id, kind, first_submitted_at)
  SELECT enrollment_id, kind, first_submitted_at FROM bak_enrollment_progress;

DROP TABLE bak_enrollments;
DROP TABLE bak_test_assignments;
DROP TABLE bak_class_roster;
DROP TABLE bak_attempts;
DROP TABLE bak_enrollment_progress;

-- 4. Test owners and the per-username sign-in lock.
ALTER TABLE tests ADD COLUMN owner_email TEXT;
CREATE INDEX idx_tests_owner ON tests(owner_email);
ALTER TABLE admin_login_attempts ADD COLUMN username TEXT NOT NULL DEFAULT '';
CREATE INDEX idx_admin_login_attempts_ip_user ON admin_login_attempts(ip, username, attempted_at);
