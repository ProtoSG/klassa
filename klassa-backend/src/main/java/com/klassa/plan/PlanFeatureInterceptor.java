package com.klassa.plan;

import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import com.klassa.shared.multitenancy.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Pre-handler that enforces {@link RequiresModule} on controller methods.
 * Runs after {@code TenantInterceptor} so {@link TenantContext} is already
 * populated for the request.
 *
 * <p>Three short-circuits:
 * <ul>
 *   <li>handler isn't a {@link HandlerMethod} (e.g. static resource) — skip</li>
 *   <li>no {@code @RequiresModule} annotation, neither method nor class — skip</li>
 *   <li>request is for a platform admin (subdomain == {@code PLATFORM}) — skip</li>
 * </ul>
 */
@Component
public class PlanFeatureInterceptor implements HandlerInterceptor {

    private final PlanService planService;

    public PlanFeatureInterceptor(PlanService planService) {
        this.planService = planService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod hm)) return true;

        RequiresModule requires = hm.getMethodAnnotation(RequiresModule.class);
        if (requires == null) {
            requires = hm.getBeanType().getAnnotation(RequiresModule.class);
        }
        if (requires == null) return true;

        String subdomain = TenantContext.getCurrentTenant();
        if (subdomain == null || TenantContext.PLATFORM.equals(subdomain)) {
            return true;
        }

        PlanFeatures features = planService.getFeatures(subdomain);
        if (!features.hasModule(requires.value())) {
            throw new BusinessRuleException(ErrorCode.MODULE_NOT_INCLUDED_IN_PLAN, requires.value());
        }
        return true;
    }
}
