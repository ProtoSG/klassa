-- Platform administrators live in the platform schema, not in any tenant schema.
-- fn_update_date_updated() was created in V5 and is already available.

CREATE TABLE platform.platform_users (
    id            BIGSERIAL    PRIMARY KEY,
    email         VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    role          VARCHAR(30)  NOT NULL DEFAULT 'PLATFORM_ADMIN',
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    user_created  VARCHAR(255) NOT NULL DEFAULT 'SYSTEM',
    date_created  TIMESTAMP    NOT NULL DEFAULT NOW(),
    user_updated  VARCHAR(255),
    date_updated  TIMESTAMP
);

CREATE TRIGGER trg_platform_users_date_updated
    BEFORE UPDATE ON platform.platform_users
    FOR EACH ROW EXECUTE FUNCTION platform.fn_update_date_updated();
