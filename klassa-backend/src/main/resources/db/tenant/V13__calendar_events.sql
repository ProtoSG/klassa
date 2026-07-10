CREATE TYPE calendar_event_type AS ENUM (
    'EXAM', 'HOLIDAY', 'PARENT_TEACHER_MEETING', 'GRADING_DEADLINE', 'SCHOOL_ACTIVITY'
);

CREATE TABLE calendar_events (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title         VARCHAR(200) NOT NULL,
    description   TEXT,
    start_date    DATE NOT NULL,
    end_date      DATE NOT NULL,
    type          calendar_event_type NOT NULL,
    user_created  VARCHAR(100) NOT NULL,
    date_created  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_updated  VARCHAR(100),
    date_updated  TIMESTAMPTZ,
    CONSTRAINT chk_calendar_events_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_calendar_events_start_date ON calendar_events (start_date);

CREATE TRIGGER trg_calendar_events_date_updated
    BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION fn_update_date_updated();
