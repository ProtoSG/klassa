package com.klassa.shared.domain.vo;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DueDayTest {

    @Test
    void validDay_inRange_ok() {
        assertThat(new DueDay(1).value()).isEqualTo(1);
        assertThat(new DueDay(15).value()).isEqualTo(15);
        assertThat(new DueDay(31).value()).isEqualTo(31);
    }

    @Test
    void belowRange_throws() {
        assertThatThrownBy(() -> new DueDay(0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("between 1 and 31");
    }

    @Test
    void aboveRange_throws() {
        assertThatThrownBy(() -> new DueDay(32))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
