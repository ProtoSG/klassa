package com.klassa.academic;

import com.klassa.shared.exception.BusinessRuleException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SectionTest {

    private Section section(int maxCapacity) {
        Section s = new Section();
        s.setName("A");
        s.setMaxCapacity(maxCapacity);
        return s;
    }

    @Test
    void assertHasCapacity_underCapacity_ok() {
        Section s = section(30);
        assertThatCode(() -> s.assertHasCapacity(29)).doesNotThrowAnyException();
    }

    @Test
    void assertHasCapacity_atCapacity_throws() {
        Section s = section(30);
        assertThatThrownBy(() -> s.assertHasCapacity(30))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("llena");
    }

    @Test
    void assertHasCapacity_overCapacity_throws() {
        Section s = section(30);
        assertThatThrownBy(() -> s.assertHasCapacity(31))
                .isInstanceOf(BusinessRuleException.class);
    }
}
