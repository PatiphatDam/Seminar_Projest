-- Capacity work for the Workers Free plan (see docs/ARCHITECTURE.md → "Capacity").
--
-- 1) enrollment_progress: one row per (enrollment, test kind) once that student has submitted any test of that kind.
--    The Classes page counts these (≤ class size rows) instead of scanning every attempt of every class.
--    Written in engine.finalizeAttempt; removed with the enrollment.
CREATE TABLE enrollment_progress (
  enrollment_id      INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  kind               TEXT    NOT NULL CHECK (kind IN ('pretest', 'posttest', 'other')),
  first_submitted_at TEXT    NOT NULL,
  PRIMARY KEY (enrollment_id, kind)
) WITHOUT ROWID;

INSERT OR IGNORE INTO enrollment_progress (enrollment_id, kind, first_submitted_at)
  SELECT a.enrollment_id, t.kind, MIN(a.submitted_at)
    FROM attempts a
    JOIN test_assignments ta ON ta.id = a.assignment_id
    JOIN tests t ON t.id = ta.test_id
   WHERE a.submitted_at IS NOT NULL
   GROUP BY a.enrollment_id, t.kind;

-- 2) classes.owner_email: the instructor who created the class. Admin lists default to "my classes" so each of many
--    instructors loads only their own sections. NULL (classes created before this) = shown to everyone.
ALTER TABLE classes ADD COLUMN owner_email TEXT;
CREATE INDEX idx_classes_owner ON classes(owner_email, status);
