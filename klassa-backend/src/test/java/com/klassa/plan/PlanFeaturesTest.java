package com.klassa.plan;

import com.klassa.tenant.Plan;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class PlanFeaturesTest {

    @Test
    void from_nullFeatures_returnsEmptySetAndZeroQuota() {
        PlanFeatures features = PlanFeatures.from(plan(null, 100));

        assertThat(features.modules()).isEmpty();
        assertThat(features.maxStudents()).isEqualTo(100);
        assertThat(features.aiMessagesPerMonth()).isZero();
    }

    @Test
    void from_modulesList_normalizesToSet() {
        PlanFeatures features = PlanFeatures.from(
                plan(Map.of("modules", List.of("billing", "assistant", "billing")), 100));

        assertThat(features.modules()).hasSize(2)
                .containsExactlyInAnyOrder("billing", "assistant");
    }

    @Test
    void from_featuresMaxStudents_winsOverPlanColumn() {
        // features.maxStudents takes precedence — used by plans that want a different cap
        // from the legacy column without a schema change.
        PlanFeatures features = PlanFeatures.from(
                plan(Map.of("maxStudents", 50, "modules", List.of("billing")), 9999));

        assertThat(features.maxStudents()).isEqualTo(50);
    }

    @Test
    void from_legacyPlan_fallsBackToPlanColumn() {
        PlanFeatures features = PlanFeatures.from(
                plan(Map.of("modules", List.of("billing")), 500));

        assertThat(features.maxStudents()).isEqualTo(500);
    }

    @Test
    void from_aiMessagesPerMonth_handlesIntegerAndNumber() {
        assertThat(PlanFeatures.from(plan(Map.of("aiMessagesPerMonth", 400), 100))
                .aiMessagesPerMonth()).isEqualTo(400);
        // Jackson serializes JSON numbers as Integer or Double depending on size; verify both work.
        assertThat(PlanFeatures.from(plan(Map.of("aiMessagesPerMonth", 400.0), 100))
                .aiMessagesPerMonth()).isEqualTo(400);
    }

    @Test
    void hasModule_distinguishesEmptyFromSet() {
        PlanFeatures empty = PlanFeatures.EMPTY;
        PlanFeatures withBilling = new PlanFeatures(Set.of("billing"), 100, 0);

        assertThat(empty.hasModule("billing")).isFalse();
        assertThat(withBilling.hasModule("billing")).isTrue();
        assertThat(withBilling.hasModule("reports")).isFalse();
    }

    @Test
    void isUnlimitedStudents_thresholdAt9999() {
        assertThat(new PlanFeatures(Set.of(), 9998, 0).isUnlimitedStudents()).isFalse();
        assertThat(new PlanFeatures(Set.of(), 9999, 0).isUnlimitedStudents()).isTrue();
        assertThat(new PlanFeatures(Set.of(), 50000, 0).isUnlimitedStudents()).isTrue();
    }

    @Test
    void canAddMoreStudents_unlimitedAlwaysTrue() {
        PlanFeatures unlimited = new PlanFeatures(Set.of(), 9999, 0);

        assertThat(unlimited.canAddMoreStudents(0)).isTrue();
        assertThat(unlimited.canAddMoreStudents(50_000)).isTrue();
        assertThat(unlimited.canAddMoreStudents(Integer.MAX_VALUE)).isTrue();
    }

    @Test
    void canAddMoreStudents_cappedAtBoundary_excludesEqualCount() {
        PlanFeatures capped = new PlanFeatures(Set.of(), 100, 0);

        assertThat(capped.canAddMoreStudents(99)).isTrue();
        assertThat(capped.canAddMoreStudents(100)).isFalse(); // strict < cap
        assertThat(capped.canAddMoreStudents(101)).isFalse();
    }

    @Test
    void remainingStudents_unlimitedReturnsMaxValue() {
        PlanFeatures unlimited = new PlanFeatures(Set.of(), 9999, 0);
        assertThat(unlimited.remainingStudents(50)).isEqualTo(Integer.MAX_VALUE);
    }

    @Test
    void remainingStudents_cappedReturnsClampedHeadroom() {
        PlanFeatures capped = new PlanFeatures(Set.of(), 100, 0);
        assertThat(capped.remainingStudents(50)).isEqualTo(50);
        assertThat(capped.remainingStudents(100)).isZero();
        assertThat(capped.remainingStudents(150)).isZero(); // never negative
    }

    private static Plan plan(Map<String, Object> features, int maxStudents) {
        Plan p = new Plan();
        p.setName("Test");
        p.setMaxStudents(maxStudents);
        // Clone because the map can be shared between Hibernate and the test.
        p.setFeatures(features != null ? new HashMap<>(features) : null);
        return p;
    }
}
