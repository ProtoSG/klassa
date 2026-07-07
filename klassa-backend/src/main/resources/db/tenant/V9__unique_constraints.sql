-- Additional unique constraints to close check-then-act races.
-- NOTE: scores (enrollment_id, subject_id, period) and enrollments (student_id, section_id)
-- are already unique from V3; only attendance and the single-active-year rule were missing.
-- Idempotent (IF NOT EXISTS) so it can be (re)applied to existing tenant schemas safely.

-- One attendance record per (enrollment, date).
CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_enrollment_date
    ON attendance_records (enrollment_id, date);

-- At most one active academic year at a time.
CREATE UNIQUE INDEX IF NOT EXISTS uq_academic_year_single_active
    ON academic_years (active)
    WHERE active;
