CREATE INDEX idx_students_family_id ON students (family_id);
CREATE INDEX idx_students_status    ON students (status);
CREATE INDEX idx_students_code      ON students (code);

CREATE INDEX idx_enrollments_student_id     ON enrollments (student_id);
CREATE INDEX idx_enrollments_section_id     ON enrollments (section_id);
CREATE INDEX idx_enrollments_status         ON enrollments (status);
CREATE INDEX idx_enrollments_student_section ON enrollments (student_id, section_id);

CREATE INDEX idx_scores_enrollment_id               ON scores (enrollment_id);
CREATE INDEX idx_scores_enrollment_subject_period   ON scores (enrollment_id, subject_id, period);

CREATE INDEX idx_attendance_enrollment_id   ON attendance_records (enrollment_id);
CREATE INDEX idx_attendance_enrollment_date ON attendance_records (enrollment_id, date);
CREATE INDEX idx_attendance_date_status     ON attendance_records (date, status);

CREATE INDEX idx_invoices_student_id     ON invoices (student_id);
CREATE INDEX idx_invoices_status         ON invoices (status);
CREATE INDEX idx_invoices_due_date       ON invoices (due_date);
CREATE INDEX idx_invoices_student_status ON invoices (student_id, status);

CREATE INDEX idx_payments_invoice_id   ON payments (invoice_id);
CREATE INDEX idx_payments_payment_date ON payments (payment_date);

CREATE INDEX idx_sections_grade_year     ON sections (grade_level_id, academic_year_id);
CREATE INDEX idx_subjects_grade_level_id ON subjects (grade_level_id);

CREATE INDEX idx_users_email  ON users (email);
CREATE INDEX idx_users_active ON users (active);
