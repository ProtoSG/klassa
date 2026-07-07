-- Flyway sets search_path automatically when schemas=[tenantName].
-- No schema prefix needed here.

CREATE TYPE user_role         AS ENUM ('ADMIN', 'TEACHER', 'TREASURER', 'PARENT');
CREATE TYPE student_gender    AS ENUM ('M', 'F');
CREATE TYPE student_status    AS ENUM ('ACTIVE', 'INACTIVE', 'TRANSFERRED');
CREATE TYPE grade_level_type  AS ENUM ('INITIAL', 'PRIMARY', 'SECONDARY');
CREATE TYPE enrollment_status AS ENUM ('ACTIVE', 'WITHDRAWN', 'TRANSFERRED');
CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'JUSTIFIED');
CREATE TYPE invoice_status    AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'PARTIAL', 'CANCELLED');
CREATE TYPE payment_method    AS ENUM ('CASH', 'TRANSFER', 'CARD', 'YAPE', 'PLIN');

CREATE TABLE users (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email          VARCHAR(200) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    role           user_role    NOT NULL,
    first_name     VARCHAR(100) NOT NULL,
    last_name      VARCHAR(100) NOT NULL,
    active         BOOLEAN      NOT NULL DEFAULT TRUE,
    user_created   VARCHAR(100) NOT NULL,
    date_created   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    user_updated   VARCHAR(100),
    date_updated   TIMESTAMPTZ
);

CREATE TABLE families (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    guardian_name     VARCHAR(200) NOT NULL,
    guardian_email    VARCHAR(200),
    guardian_phone    VARCHAR(20),
    address           TEXT,
    emergency_contact VARCHAR(200),
    emergency_phone   VARCHAR(20),
    user_created      VARCHAR(100) NOT NULL,
    date_created      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    user_updated      VARCHAR(100),
    date_updated      TIMESTAMPTZ
);

CREATE TABLE students (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code         VARCHAR(20)     NOT NULL UNIQUE,
    first_name   VARCHAR(100)    NOT NULL,
    last_name    VARCHAR(100)    NOT NULL,
    birth_date   DATE            NOT NULL,
    gender       student_gender  NOT NULL,
    status       student_status  NOT NULL DEFAULT 'ACTIVE',
    family_id    BIGINT          REFERENCES families (id),
    photo_url    VARCHAR(500),
    user_created VARCHAR(100)    NOT NULL,
    date_created TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    user_updated VARCHAR(100),
    date_updated TIMESTAMPTZ
);

CREATE TABLE academic_years (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    start_date   DATE         NOT NULL,
    end_date     DATE         NOT NULL,
    active       BOOLEAN      NOT NULL DEFAULT FALSE,
    user_created VARCHAR(100) NOT NULL,
    date_created TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    user_updated VARCHAR(100),
    date_updated TIMESTAMPTZ
);

CREATE TABLE grade_levels (
    id           BIGINT           GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name         VARCHAR(100)     NOT NULL,
    level        grade_level_type NOT NULL,
    sort_order   INT              NOT NULL DEFAULT 0,
    user_created VARCHAR(100)     NOT NULL,
    date_created TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    user_updated VARCHAR(100),
    date_updated TIMESTAMPTZ
);

CREATE TABLE sections (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name                 VARCHAR(50)  NOT NULL,
    grade_level_id       BIGINT       NOT NULL REFERENCES grade_levels (id),
    academic_year_id     BIGINT       NOT NULL REFERENCES academic_years (id),
    homeroom_teacher_id  BIGINT       REFERENCES users (id),
    max_capacity         INT          NOT NULL DEFAULT 30,
    user_created         VARCHAR(100) NOT NULL,
    date_created         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    user_updated         VARCHAR(100),
    date_updated         TIMESTAMPTZ
);

CREATE TABLE subjects (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    grade_level_id BIGINT       NOT NULL REFERENCES grade_levels (id),
    hours_per_week INT          NOT NULL DEFAULT 1,
    active         BOOLEAN      NOT NULL DEFAULT TRUE,
    user_created   VARCHAR(100) NOT NULL,
    date_created   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    user_updated   VARCHAR(100),
    date_updated   TIMESTAMPTZ
);

CREATE TABLE enrollments (
    id           BIGINT            GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id   BIGINT            NOT NULL REFERENCES students (id),
    section_id   BIGINT            NOT NULL REFERENCES sections (id),
    enrolled_at  TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    status       enrollment_status NOT NULL DEFAULT 'ACTIVE',
    user_created VARCHAR(100)      NOT NULL,
    date_created TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    user_updated VARCHAR(100),
    date_updated TIMESTAMPTZ
);

CREATE TABLE scores (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    enrollment_id BIGINT         NOT NULL REFERENCES enrollments (id),
    subject_id    BIGINT         NOT NULL REFERENCES subjects (id),
    period        INT            NOT NULL,
    score         DECIMAL(4, 2)  NOT NULL,
    created_by    BIGINT         REFERENCES users (id),
    user_created  VARCHAR(100)   NOT NULL,
    date_created  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    user_updated  VARCHAR(100),
    date_updated  TIMESTAMPTZ
);

CREATE TABLE attendance_records (
    id             BIGINT            GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    enrollment_id  BIGINT            NOT NULL REFERENCES enrollments (id),
    date           DATE              NOT NULL,
    status         attendance_status NOT NULL,
    note           TEXT,
    registered_by  BIGINT            REFERENCES users (id),
    user_created   VARCHAR(100)      NOT NULL,
    date_created   TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    user_updated   VARCHAR(100),
    date_updated   TIMESTAMPTZ
);

CREATE TABLE fee_schedules (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    concept          VARCHAR(200)   NOT NULL,
    amount           DECIMAL(10, 2) NOT NULL,
    due_day          INT            NOT NULL,
    academic_year_id BIGINT         NOT NULL REFERENCES academic_years (id),
    active           BOOLEAN        NOT NULL DEFAULT TRUE,
    user_created     VARCHAR(100)   NOT NULL,
    date_created     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    user_updated     VARCHAR(100),
    date_updated     TIMESTAMPTZ
);

CREATE TABLE invoices (
    id              BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    invoice_number  VARCHAR(50)     NOT NULL UNIQUE,
    student_id      BIGINT          NOT NULL REFERENCES students (id),
    fee_schedule_id BIGINT          REFERENCES fee_schedules (id),
    concept         VARCHAR(200)    NOT NULL,
    amount          DECIMAL(10, 2)  NOT NULL,
    due_date        DATE            NOT NULL,
    status          invoice_status  NOT NULL DEFAULT 'PENDING',
    user_created    VARCHAR(100)    NOT NULL,
    date_created    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    user_updated    VARCHAR(100),
    date_updated    TIMESTAMPTZ
);

CREATE TABLE payments (
    id             BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    invoice_id     BIGINT          NOT NULL REFERENCES invoices (id),
    amount         DECIMAL(10, 2)  NOT NULL,
    payment_date   DATE            NOT NULL,
    method         payment_method  NOT NULL,
    receipt_number VARCHAR(100),
    registered_by  BIGINT          REFERENCES users (id),
    notes          TEXT,
    user_created   VARCHAR(100)    NOT NULL,
    date_created   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    user_updated   VARCHAR(100),
    date_updated   TIMESTAMPTZ
);
