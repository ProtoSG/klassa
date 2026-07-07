package com.klassa.shared.exception;

public final class BusinessRuleException extends KlassaException {

    public BusinessRuleException(ErrorCode code, Object... args) {
        super(code.name(), code.format(args), 422);
    }
}
