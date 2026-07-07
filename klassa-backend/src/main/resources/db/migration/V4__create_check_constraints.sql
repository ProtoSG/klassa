SET search_path TO template_tenant;

-- ─── SCORES ─────────────────────────────────────────────────────────────────

ALTER TABLE scores
    ADD CONSTRAINT chk_scores_score  CHECK (score BETWEEN 0 AND 20),
    ADD CONSTRAINT chk_scores_period CHECK (period BETWEEN 1 AND 4);

ALTER TABLE scores
    ADD CONSTRAINT uq_scores_enrollment_subject_period
        UNIQUE (enrollment_id, subject_id, period);

-- ─── PAYMENTS ───────────────────────────────────────────────────────────────

ALTER TABLE payments
    ADD CONSTRAINT chk_payments_amount CHECK (amount > 0);

-- ─── INVOICES ───────────────────────────────────────────────────────────────

ALTER TABLE invoices
    ADD CONSTRAINT chk_invoices_amount CHECK (amount > 0);

-- ─── FEE SCHEDULES ──────────────────────────────────────────────────────────

ALTER TABLE fee_schedules
    ADD CONSTRAINT chk_fee_schedules_amount  CHECK (amount > 0),
    ADD CONSTRAINT chk_fee_schedules_due_day CHECK (due_day BETWEEN 1 AND 31);

-- ─── SECTIONS ───────────────────────────────────────────────────────────────

ALTER TABLE sections
    ADD CONSTRAINT chk_sections_max_capacity CHECK (max_capacity > 0 AND max_capacity <= 100);

-- ─── STUDENTS ───────────────────────────────────────────────────────────────

ALTER TABLE students
    ADD CONSTRAINT chk_students_birth_date CHECK (birth_date < CURRENT_DATE);

-- ─── ACADEMIC YEARS ─────────────────────────────────────────────────────────

ALTER TABLE academic_years
    ADD CONSTRAINT chk_academic_years_dates CHECK (end_date > start_date);

-- ─── ENROLLMENTS ────────────────────────────────────────────────────────────
-- One student per section only (one active enrollment per section/year)

ALTER TABLE enrollments
    ADD CONSTRAINT uq_enrollments_student_section UNIQUE (student_id, section_id);

RESET search_path;
