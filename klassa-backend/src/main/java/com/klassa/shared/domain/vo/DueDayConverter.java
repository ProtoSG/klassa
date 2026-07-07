package com.klassa.shared.domain.vo;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class DueDayConverter implements AttributeConverter<DueDay, Integer> {

    @Override
    public Integer convertToDatabaseColumn(DueDay attribute) {
        return attribute != null ? attribute.value() : null;
    }

    @Override
    public DueDay convertToEntityAttribute(Integer dbData) {
        return dbData != null ? new DueDay(dbData) : null;
    }
}
