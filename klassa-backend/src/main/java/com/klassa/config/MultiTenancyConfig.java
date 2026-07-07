package com.klassa.config;

import com.klassa.shared.multitenancy.SchemaMultiTenantProvider;
import com.klassa.shared.multitenancy.TenantIdentifierResolver;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MultiTenancyConfig {

    @Bean
    public HibernatePropertiesCustomizer hibernatePropertiesCustomizer(
            SchemaMultiTenantProvider connectionProvider,
            TenantIdentifierResolver identifierResolver) {
        return props -> {
            props.put("hibernate.multi_tenant_connection_provider", connectionProvider);
            props.put("hibernate.tenant_identifier_resolver", identifierResolver);
        };
    }
}
