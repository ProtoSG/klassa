CREATE OR REPLACE PROCEDURE sp_generate_monthly_invoices(
    p_academic_year_id BIGINT, p_fee_schedule_id BIGINT,
    p_due_date DATE, p_user VARCHAR(100)
) LANGUAGE plpgsql AS
$$
DECLARE
    v_concept VARCHAR(200);
    v_amount  DECIMAL(10, 2);
BEGIN
    SELECT concept, amount INTO v_concept, v_amount FROM fee_schedules WHERE id = p_fee_schedule_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'FeeSchedule % not found', p_fee_schedule_id;
    END IF;

    INSERT INTO invoices (invoice_number, student_id, fee_schedule_id, concept, amount,
                          due_date, status, user_created, date_created)
    SELECT 'FS-' || p_fee_schedule_id || '-' || e.student_id || '-' || TO_CHAR(p_due_date, 'YYYYMM'),
           e.student_id, p_fee_schedule_id, v_concept, v_amount, p_due_date,
           'PENDING', p_user, NOW()
    FROM enrollments e
             JOIN sections s ON s.id = e.section_id
    WHERE s.academic_year_id = p_academic_year_id AND e.status = 'ACTIVE'
    ON CONFLICT (invoice_number) DO NOTHING;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_close_academic_year(
    p_academic_year_id BIGINT, p_user VARCHAR(100)
) LANGUAGE plpgsql AS
$$
DECLARE v_pending_count INT;
BEGIN
    SELECT COUNT(*) INTO v_pending_count
    FROM invoices i
             JOIN students s ON s.id = i.student_id
             JOIN enrollments e ON e.student_id = s.id
             JOIN sections sec ON sec.id = e.section_id
    WHERE sec.academic_year_id = p_academic_year_id AND e.status = 'ACTIVE'
      AND i.status IN ('PENDING', 'OVERDUE');

    IF v_pending_count > 0 THEN
        RAISE EXCEPTION 'Cannot close academic year: % pending/overdue invoice(s) exist', v_pending_count;
    END IF;

    UPDATE enrollments e
    SET status = 'WITHDRAWN', user_updated = p_user, date_updated = NOW()
    FROM sections s
    WHERE s.id = e.section_id AND s.academic_year_id = p_academic_year_id AND e.status = 'ACTIVE';

    UPDATE academic_years
    SET active = FALSE, user_updated = p_user, date_updated = NOW()
    WHERE id = p_academic_year_id;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_transfer_student(
    p_enrollment_id BIGINT, p_new_section_id BIGINT, p_user VARCHAR(100)
) LANGUAGE plpgsql AS
$$
DECLARE v_student_id BIGINT;
BEGIN
    IF fn_is_section_full(p_new_section_id) THEN
        RAISE EXCEPTION 'Target section % is at full capacity', p_new_section_id;
    END IF;

    SELECT student_id INTO v_student_id FROM enrollments
    WHERE id = p_enrollment_id AND status = 'ACTIVE';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Active enrollment % not found', p_enrollment_id;
    END IF;

    UPDATE enrollments
    SET status = 'TRANSFERRED', user_updated = p_user, date_updated = NOW()
    WHERE id = p_enrollment_id;

    INSERT INTO enrollments (student_id, section_id, enrolled_at, status, user_created, date_created)
    VALUES (v_student_id, p_new_section_id, NOW(), 'ACTIVE', p_user, NOW());
END;
$$;
