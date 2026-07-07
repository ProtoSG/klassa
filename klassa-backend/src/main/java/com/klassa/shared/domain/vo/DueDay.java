package com.klassa.shared.domain.vo;

public record DueDay(int value) {
    public DueDay {
        if (value < 1 || value > 31)
            throw new IllegalArgumentException("DueDay must be between 1 and 31, got: " + value);
    }
}
