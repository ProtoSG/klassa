package com.klassa.plan;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a controller method (or whole controller class) as requiring a given
 * plan module. Applied by {@link PlanFeatureInterceptor}, which 422s the
 * request with {@code MODULE_NOT_INCLUDED_IN_PLAN} when the tenant's plan
 * doesn't include the named module.
 *
 * <p>Class-level annotations apply to every method; method-level wins on
 * conflict. Platform-admin requests bypass the check.
 *
 * <p>Convention for module names: lowercase, single word ({@code "billing"},
 * {@code "assistant"}, {@code "reports"}). These must match the strings
 * stored in {@code plans.features.modules} JSONB.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiresModule {
    String value();
}
