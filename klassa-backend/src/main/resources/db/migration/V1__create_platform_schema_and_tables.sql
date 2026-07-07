CREATE SCHEMA IF NOT EXISTS platform;

CREATE TABLE platform.plans (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name           VARCHAR(100)    NOT NULL,
    max_students   INT             NOT NULL,
    price_monthly  DECIMAL(10, 2)  NOT NULL,
    features       JSONB,
    active         BOOLEAN         NOT NULL DEFAULT TRUE,
    user_created   VARCHAR(100)    NOT NULL,
    date_created   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    user_updated   VARCHAR(100),
    date_updated   TIMESTAMPTZ
);

CREATE TABLE platform.tenants (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    subdomain      VARCHAR(50)     NOT NULL UNIQUE,
    name           VARCHAR(200)    NOT NULL,
    status         VARCHAR(20)     NOT NULL DEFAULT 'TRIAL',
    plan_id        BIGINT          NOT NULL REFERENCES platform.plans (id),
    trial_ends_at  TIMESTAMPTZ,
    created_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    user_created   VARCHAR(100)    NOT NULL,
    date_created   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    user_updated   VARCHAR(100),
    date_updated   TIMESTAMPTZ,
    CONSTRAINT chk_tenant_status CHECK (status IN ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED'))
);

CREATE INDEX idx_tenants_subdomain ON platform.tenants (subdomain);
CREATE INDEX idx_tenants_status    ON platform.tenants (status);
CREATE INDEX idx_plans_active      ON platform.plans (active);
