ALTER TABLE scores
    ADD CONSTRAINT chk_scores_score  CHECK (score BETWEEN 0 AND 20),
    ADD CONSTRAINT chk_scores_period CHECK (period BETWEEN 1 AND 4),
    ADD CONSTRAINT uq_scores_enrollment_subject_period UNIQUE (enrollment_id, subject_id, period);

ALTER TABLE payments
    ADD CONSTRAINT chk_payments_amount CHECK (amount > 0);

ALTER TABLE invoices
    ADD CONSTRAINT chk_invoices_amount CHECK (amount > 0);

ALTER TABLE fee_schedules
    ADD CONSTRAINT chk_fee_schedules_amount  CHECK (amount > 0),
    ADD CONSTRAINT chk_fee_schedules_due_day CHECK (due_day BETWEEN 1 AND 31);

ALTER TABLE sections
    ADD CONSTRAINT chk_sections_max_capacity CHECK (max_capacity > 0 AND max_capacity <= 100);

ALTER TABLE students
    ADD CONSTRAINT chk_students_birth_date CHECK (birth_date < CURRENT_DATE);

ALTER TABLE academic_years
    ADD CONSTRAINT chk_academic_years_dates CHECK (end_date > start_date);

ALTER TABLE enrollments
    ADD CONSTRAINT uq_enrollments_student_section UNIQUE (student_id, section_id);
