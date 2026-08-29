package com.klassa.config;

import com.klassa.plan.PlanFeatureInterceptor;
import com.klassa.shared.multitenancy.TenantInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final TenantInterceptor tenantInterceptor;
    private final PlanFeatureInterceptor planFeatureInterceptor;

    public WebMvcConfig(TenantInterceptor tenantInterceptor,
                        PlanFeatureInterceptor planFeatureInterceptor) {
        this.tenantInterceptor = tenantInterceptor;
        this.planFeatureInterceptor = planFeatureInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(tenantInterceptor);
        // PlanFeatureInterceptor must run AFTER TenantInterceptor so TenantContext
        // is populated before the feature check resolves the current tenant's plan.
        registry.addInterceptor(planFeatureInterceptor);
    }
}
