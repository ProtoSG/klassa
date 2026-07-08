package com.klassa.student;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;

/**
 * Generates sequential student codes in the {@code {year}-{seq}} format (e.g. {@code 2026-001}),
 * scoped per tenant schema and reset every calendar year.
 */
@Component
public class StudentCodeGenerator {

    private static final String UPSERT_COUNTER_SQL = """
            INSERT INTO student_code_counters (year, last_seq) VALUES (:year, 1)
            ON CONFLICT (year) DO UPDATE SET last_seq = student_code_counters.last_seq + 1
            RETURNING last_seq
            """;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public String nextCode() {
        int year = Year.now().getValue();
        Number lastSeq = (Number) entityManager.createNativeQuery(UPSERT_COUNTER_SQL)
                .setParameter("year", year)
                .getSingleResult();
        return String.format("%d-%03d", year, lastSeq.intValue());
    }
}
