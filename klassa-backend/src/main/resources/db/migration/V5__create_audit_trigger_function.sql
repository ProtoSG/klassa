SET search_path TO template_tenant;

-- ─── REUSABLE TRIGGER FUNCTION ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_update_date_updated()
    RETURNS TRIGGER AS
$$
BEGIN
    NEW.date_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── TRIGGERS — TENANT TABLES ────────────────────────────────────────────────

CREATE TRIGGER trg_users_date_updated
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_update_date_updated();

CREATE TRIGGER trg_families_date_updated
    BEFORE UPDATE ON families
    FOR EACH ROW EXECUTE FUNCTION fn_update_date_updated();

CREATE TRIGGER trg_students_date_updated
    BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION fn_update_date_updated();

CREATE TRIGGER trg_academic_years_date_updated
    BEFORE UPDATE ON academic_years
    FOR EACH ROW EXECUTE FUNCTION fn_update_date_updated();

CREATE TRIGGER trg_grade_levels_date_updated
    BEFORE UPDATE ON grade_levels
    FOR EACH ROW EXECUTE FUNCTION fn_update_date_updated();

CREATE TRIGGER trg_sections_date_updated
    BEFORE UPDATE ON sections
    FOR EACH ROW EXECUTE FUNCTION fn_update_date_updated();

CREATE TRIGGER trg_subjects_date_updated
    BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION fn_update_date_updated();

CREATE TRIGGER trg_enrollments_date_updated
    BEFORE UPDATE ON enrollments
    FOR EACH ROW EXECUTE FUNCTION fn_update_date_updated();

CREATE TRIGGER trg_scores_date_updated
    BEFORE UPDATE ON scores
    FOR EACH ROW EXECUTE FUNCTION fn_update_date_updated();

CREATE TRIGGER trg_attendance_records_date_updated
    BEFORE UPDATE ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION fn_update_date_updated();

CREATE TRIGGER trg_fee_schedules_date_updated
    BEFORE UPDATE ON fee_schedules
    FOR EACH ROW EXECUTE FUNCTION fn_update_date_updated();

CREATE TRIGGER trg_invoices_date_updated
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION fn_update_date_updated();

CREATE TRIGGER trg_payments_date_updated
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION fn_update_date_updated();

RESET search_path;

-- ─── TRIGGERS — PLATFORM TABLES ──────────────────────────────────────────────
-- fn_update_date_updated is schema-qualified because platform uses its own search_path

CREATE OR REPLACE FUNCTION platform.fn_update_date_updated()
    RETURNS TRIGGER AS
$$
BEGIN
    NEW.date_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_plans_date_updated
    BEFORE UPDATE ON platform.plans
    FOR EACH ROW EXECUTE FUNCTION platform.fn_update_date_updated();

CREATE TRIGGER trg_tenants_date_updated
    BEFORE UPDATE ON platform.tenants
    FOR EACH ROW EXECUTE FUNCTION platform.fn_update_date_updated();
