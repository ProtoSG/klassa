package com.klassa.assistant;

import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;

/**
 * Tracks and caps AI assistant usage per tenant per calendar month. Atomic increment-and-check,
 * mirroring {@code StudentCodeGenerator.nextCode()}'s upsert-counter pattern exactly (see that
 * class for the reference implementation this was copied from).
 */
@Component
public class AssistantUsageService {

    private static final DateTimeFormatter YEAR_MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM");

    private static final String UPSERT_COUNTER_SQL = """
            INSERT INTO ai_usage_counters (year_month, message_count) VALUES (:ym, 1)
            ON CONFLICT (year_month) DO UPDATE SET message_count = ai_usage_counters.message_count + 1
            RETURNING message_count
            """;

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Atomically increments this month's counter and throws {@link ErrorCode#ASSISTANT_QUOTA_EXCEEDED}
     * if the resulting count exceeds {@code quota}. A {@code quota <= 0} means the plan has no AI
     * quota configured (or it's explicitly disabled) — rejected immediately without touching the
     * counter at all, so a disabled tenant never even shows up in the usage table.
     */
    @Transactional
    public void checkAndIncrement(int quota) {
        if (quota <= 0) {
            throw new BusinessRuleException(ErrorCode.ASSISTANT_QUOTA_EXCEEDED);
        }

        String yearMonth = YearMonth.now().format(YEAR_MONTH_FORMAT);
        Number messageCount = (Number) entityManager.createNativeQuery(UPSERT_COUNTER_SQL)
                .setParameter("ym", yearMonth)
                .getSingleResult();

        if (messageCount.intValue() > quota) {
            throw new BusinessRuleException(ErrorCode.ASSISTANT_QUOTA_EXCEEDED);
        }
    }
}
