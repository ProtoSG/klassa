CREATE TABLE teaching_assignments (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    section_id    BIGINT       NOT NULL REFERENCES sections (id),
    subject_id    BIGINT       NOT NULL REFERENCES subjects (id),
    teacher_id    BIGINT       NOT NULL REFERENCES users (id),
    user_created  VARCHAR(100) NOT NULL,
    date_created  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    user_updated  VARCHAR(100),
    date_updated  TIMESTAMPTZ,
    CONSTRAINT uq_teaching_assignment_section_subject UNIQUE (section_id, subject_id)
);

CREATE INDEX idx_teaching_assignments_teacher ON teaching_assignments (teacher_id);
CREATE INDEX idx_teaching_assignments_section ON teaching_assignments (section_id);

CREATE TRIGGER trg_teaching_assignments_date_updated
    BEFORE UPDATE ON teaching_assignments FOR EACH ROW EXECUTE FUNCTION fn_update_date_updated();
