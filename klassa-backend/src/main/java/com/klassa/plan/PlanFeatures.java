package com.klassa.plan;

import com.klassa.tenant.Plan;

import java.util.Collections;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Normalized view of the {@code plans.features} JSONB blob combined with the
 * legacy {@code plans.max_students} column. The plan-level column is the
 * source of truth for capacity; the JSONB blob is the source of truth for
 * module-level feature gating.
 *
 * Plans with {@code maxStudents >= UNLIMITED_PLAN_THRESHOLD} are treated as
 * "unlimited" — matches the frontend's own convention in {@code Pricing.tsx}
 * and {@code TenantService.UNLIMITED_PLAN_THRESHOLD}.
 */
public record PlanFeatures(Set<String> modules, int maxStudents, int aiMessagesPerMonth) {

    /** Sentinel: any plan at or above this cap means "unlimited" students. */
    public static final int UNLIMITED_PLAN_THRESHOLD = 9999;

    /** Empty features — used when a tenant has no plan (shouldn't happen, but defensive). */
    public static final PlanFeatures EMPTY = new PlanFeatures(Set.of(), 0, 0);

    public static PlanFeatures from(Plan plan) {
        Map<String, Object> raw = plan.getFeatures() != null ? plan.getFeatures() : Map.of();
        return new PlanFeatures(
                extractModules(raw),
                resolveMaxStudents(raw, plan.getMaxStudents()),
                extractInt(raw, "aiMessagesPerMonth"));
    }

    /** Reads {@code features.modules} as a list of strings. Returns empty set if absent. */
    static Set<String> extractModules(Map<String, Object> raw) {
        Object m = raw.get("modules");
        if (m instanceof Iterable<?> iter) {
            Set<String> result = new HashSet<>();
            for (Object o : iter) {
                if (o != null) result.add(o.toString());
            }
            return Collections.unmodifiableSet(result);
        }
        return Set.of();
    }

    /**
     * {@code features.maxStudents} wins if present; otherwise falls back to the
     * legacy {@code plans.max_students} column so old plans without the JSONB
     * key still enforce the cap.
     */
    static int resolveMaxStudents(Map<String, Object> raw, int planMaxStudents) {
        Object v = raw.get("maxStudents");
        if (v instanceof Number n) return n.intValue();
        return planMaxStudents;
    }

    static int extractInt(Map<String, Object> raw, String key) {
        Object v = raw.get(key);
        if (v instanceof Number n) return n.intValue();
        return 0;
    }

    public boolean hasModule(String module) {
        return modules.contains(module);
    }

    public boolean isUnlimitedStudents() {
        return maxStudents >= UNLIMITED_PLAN_THRESHOLD;
    }

    public boolean canAddMoreStudents(int currentCount) {
        return isUnlimitedStudents() || currentCount < maxStudents;
    }

    /** Returns the headroom for new students, or {@link Integer#MAX_VALUE} for unlimited plans. */
    public int remainingStudents(int currentCount) {
        if (isUnlimitedStudents()) return Integer.MAX_VALUE;
        return Math.max(0, maxStudents - currentCount);
    }
}
