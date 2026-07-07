package com.klassa.student;

import com.klassa.shared.exception.BusinessRuleException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StudentTest {

    private Student student(StudentStatus status) {
        Student s = new Student();
        s.setStatus(status);
        return s;
    }

    @Test
    void deactivate_active_setsInactive() {
        Student s = student(StudentStatus.ACTIVE);
        s.deactivate();
        assertThat(s.getStatus()).isEqualTo(StudentStatus.INACTIVE);
    }

    @Test
    void deactivate_alreadyInactive_throws() {
        Student s = student(StudentStatus.INACTIVE);
        assertThatThrownBy(s::deactivate)
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("ya está inactivo");
    }

    @Test
    void activate_inactive_setsActive() {
        Student s = student(StudentStatus.INACTIVE);
        s.activate();
        assertThat(s.getStatus()).isEqualTo(StudentStatus.ACTIVE);
    }

    @Test
    void activate_alreadyActive_throws() {
        Student s = student(StudentStatus.ACTIVE);
        assertThatThrownBy(s::activate)
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("ya está activo");
    }

    @Test
    void transfer_setsTransferred() {
        Student s = student(StudentStatus.ACTIVE);
        s.transfer();
        assertThat(s.getStatus()).isEqualTo(StudentStatus.TRANSFERRED);
    }
}
