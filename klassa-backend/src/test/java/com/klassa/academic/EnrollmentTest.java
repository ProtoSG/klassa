package com.klassa.academic;

import com.klassa.shared.exception.BusinessRuleException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class EnrollmentTest {

    private Enrollment enrollment(EnrollmentStatus status) {
        Enrollment e = new Enrollment();
        e.setStatus(status);
        return e;
    }

    @Test
    void withdraw_active_setsWithdrawn() {
        Enrollment e = enrollment(EnrollmentStatus.ACTIVE);
        e.withdraw();
        assertThat(e.getStatus()).isEqualTo(EnrollmentStatus.WITHDRAWN);
    }

    @Test
    void withdraw_nonActive_throws() {
        Enrollment e = enrollment(EnrollmentStatus.WITHDRAWN);
        assertThatThrownBy(e::withdraw)
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("no está activa");
    }

    @Test
    void markTransferred_active_setsTransferred() {
        Enrollment e = enrollment(EnrollmentStatus.ACTIVE);
        e.markTransferred();
        assertThat(e.getStatus()).isEqualTo(EnrollmentStatus.TRANSFERRED);
    }

    @Test
    void markTransferred_nonActive_throws() {
        Enrollment e = enrollment(EnrollmentStatus.TRANSFERRED);
        assertThatThrownBy(e::markTransferred)
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void canRecordAttendance_onlyWhenActive() {
        assertThat(enrollment(EnrollmentStatus.ACTIVE).canRecordAttendance()).isTrue();
        assertThat(enrollment(EnrollmentStatus.WITHDRAWN).canRecordAttendance()).isFalse();
        assertThat(enrollment(EnrollmentStatus.TRANSFERRED).canRecordAttendance()).isFalse();
    }
}
