package com.klassa.shared.exception;

public final class EntityNotFoundException extends KlassaException {

    public EntityNotFoundException(String entity, Long id) {
        super(ErrorCode.NOT_FOUND.name(), ErrorCode.NOT_FOUND.format(entity, id), 404);
    }

    public EntityNotFoundException(String entity, String field, String value) {
        super(ErrorCode.NOT_FOUND_BY_FIELD.name(), ErrorCode.NOT_FOUND_BY_FIELD.format(entity, field, value), 404);
    }
}
