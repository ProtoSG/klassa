package com.klassa.academic;

import com.klassa.shared.exception.BusinessRuleException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AcademicYearTest {

    @Test
    void activate_setsActiveTrue() {
        AcademicYear y = new AcademicYear();
        y.setActive(false);
        y.activate();
        assertThat(y.getActive()).isTrue();
    }

    @Test
    void assertCanClose_active_ok() {
        AcademicYear y = new AcademicYear();
        y.setActive(true);
        assertThatCode(y::assertCanClose).doesNotThrowAnyException();
    }

    @Test
    void assertCanClose_inactive_throws() {
        AcademicYear y = new AcademicYear();
        y.setActive(false);
        assertThatThrownBy(y::assertCanClose)
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("ya está cerrado");
    }
}
