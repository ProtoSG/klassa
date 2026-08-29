package com.klassa.assistant;

import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssistantUsageServiceTest {

    @Mock
    private EntityManager entityManager;
    @Mock
    private Query query;

    private AssistantUsageService service() {
        AssistantUsageService service = new AssistantUsageService();
        ReflectionTestUtils.setField(service, "entityManager", entityManager);
        return service;
    }

    @Test
    void quotaDisabled_zero_rejectsImmediately_withoutTouchingCounter() {
        AssistantUsageService service = service();

        assertThatThrownBy(() -> service.checkAndIncrement(0))
                .isInstanceOf(BusinessRuleException.class)
                .extracting("code")
                .isEqualTo(ErrorCode.ASSISTANT_QUOTA_EXCEEDED.name());

        verifyNoInteractions(entityManager);
    }

    @Test
    void quotaDisabled_negative_rejectsImmediately_withoutTouchingCounter() {
        AssistantUsageService service = service();

        assertThatThrownBy(() -> service.checkAndIncrement(-5))
                .isInstanceOf(BusinessRuleException.class);

        verifyNoInteractions(entityManager);
    }

    @Test
    void underQuota_incrementsAndDoesNotThrow() {
        when(entityManager.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        when(query.getSingleResult()).thenReturn(3);

        AssistantUsageService service = service();

        service.checkAndIncrement(10);

        verify(entityManager).createNativeQuery(anyString());
    }

    @Test
    void exceedingQuota_throwsAssistantQuotaExceeded() {
        when(entityManager.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        when(query.getSingleResult()).thenReturn(11);

        AssistantUsageService service = service();

        assertThatThrownBy(() -> service.checkAndIncrement(10))
                .isInstanceOf(BusinessRuleException.class)
                .extracting("code")
                .isEqualTo(ErrorCode.ASSISTANT_QUOTA_EXCEEDED.name());
    }

    @Test
    void exactlyAtQuota_doesNotThrow() {
        when(entityManager.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        when(query.getSingleResult()).thenReturn(10);

        AssistantUsageService service = service();

        service.checkAndIncrement(10);

        assertThat(true).isTrue();
    }
}
