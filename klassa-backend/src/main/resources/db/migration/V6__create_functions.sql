SET search_path TO template_tenant;

-- ─────────────────────────────────────────────────────────────────────────────
-- fn_get_attendance_percentage
-- Returns attendance % for an enrollment in a date range.
-- Counts PRESENT and LATE as attended days.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_get_attendance_percentage(
    p_enrollment_id BIGINT,
    p_start_date    DATE,
    p_end_date      DATE
)
    RETURNS DECIMAL(5, 2)
    LANGUAGE plpgsql
    STABLE
AS
$$
DECLARE
    v_total    INT;
    v_attended INT;
BEGIN
    SELECT COUNT(*)
    INTO v_total
    FROM attendance_records
    WHERE enrollment_id = p_enrollment_id
      AND date BETWEEN p_start_date AND p_end_date;

    IF v_total = 0 THEN
        RETURN 0;
    END IF;

    SELECT COUNT(*)
    INTO v_attended
    FROM attendance_records
    WHERE enrollment_id = p_enrollment_id
      AND date BETWEEN p_start_date AND p_end_date
      AND status IN ('PRESENT', 'LATE');

    RETURN ROUND((v_attended::DECIMAL / v_total) * 100, 2);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- fn_get_student_pending_balance
-- Sum of unpaid invoice amounts (PENDING, OVERDUE, PARTIAL).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_get_student_pending_balance(
    p_student_id BIGINT
)
    RETURNS DECIMAL(12, 2)
    LANGUAGE plpgsql
    STABLE
AS
$$
DECLARE
    v_balance DECIMAL(12, 2);
BEGIN
    SELECT COALESCE(SUM(i.amount) - COALESCE(SUM(p.paid), 0), 0)
    INTO v_balance
    FROM invoices i
             LEFT JOIN (
        SELECT invoice_id, SUM(amount) AS paid
        FROM payments
        GROUP BY invoice_id
    ) p ON p.invoice_id = i.id
    WHERE i.student_id = p_student_id
      AND i.status IN ('PENDING', 'OVERDUE', 'PARTIAL');

    RETURN COALESCE(v_balance, 0);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- fn_get_enrollment_average
-- Overall average score for all subjects and periods in an enrollment.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_get_enrollment_average(
    p_enrollment_id BIGINT
)
    RETURNS DECIMAL(4, 2)
    LANGUAGE plpgsql
    STABLE
AS
$$
DECLARE
    v_avg DECIMAL(4, 2);
BEGIN
    SELECT ROUND(AVG(score), 2)
    INTO v_avg
    FROM scores
    WHERE enrollment_id = p_enrollment_id;

    RETURN COALESCE(v_avg, 0);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- fn_get_period_average
-- Average score for a specific bimester/period within an enrollment.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_get_period_average(
    p_enrollment_id BIGINT,
    p_period        INT
)
    RETURNS DECIMAL(4, 2)
    LANGUAGE plpgsql
    STABLE
AS
$$
DECLARE
    v_avg DECIMAL(4, 2);
BEGIN
    SELECT ROUND(AVG(score), 2)
    INTO v_avg
    FROM scores
    WHERE enrollment_id = p_enrollment_id
      AND period = p_period;

    RETURN COALESCE(v_avg, 0);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- fn_is_section_full
-- Returns TRUE if active enrollments >= max_capacity.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_is_section_full(
    p_section_id BIGINT
)
    RETURNS BOOLEAN
    LANGUAGE plpgsql
    STABLE
AS
$$
DECLARE
    v_active_count INT;
    v_max_capacity INT;
BEGIN
    SELECT max_capacity INTO v_max_capacity
    FROM sections
    WHERE id = p_section_id;

    SELECT COUNT(*) INTO v_active_count
    FROM enrollments
    WHERE section_id = p_section_id
      AND status = 'ACTIVE';

    RETURN v_active_count >= v_max_capacity;
END;
$$;

RESET search_path;
