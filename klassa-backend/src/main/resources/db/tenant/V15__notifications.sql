CREATE TABLE notifications (
    id                 BIGSERIAL PRIMARY KEY,
    recipient_user_id  BIGINT NOT NULL REFERENCES users (id),
    type               VARCHAR(40) NOT NULL,
    title              VARCHAR(200) NOT NULL,
    message            VARCHAR(500) NOT NULL,
    student_id         BIGINT REFERENCES students (id),
    read_flag          BOOLEAN NOT NULL DEFAULT FALSE,
    user_created       VARCHAR(100) NOT NULL,
    date_created       TIMESTAMP NOT NULL,
    user_updated       VARCHAR(100),
    date_updated       TIMESTAMP
);

-- Portal home fetches "my unread, newest first" on every load.
CREATE INDEX idx_notifications_recipient ON notifications (recipient_user_id, read_flag, date_created DESC);
