package com.klassa.shared.exception;

public sealed class KlassaException extends RuntimeException
        permits EntityNotFoundException, BusinessRuleException {

    private final String code;
    private final int statusCode;

    protected KlassaException(String code, String message, int statusCode) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
    }

    public String getCode() {
        return code;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
