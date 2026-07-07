package com.klassa.shared.web;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(T data, String code, String message, int status) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(data, null, "OK", 200);
    }

    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(data, null, message, 200);
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(data, null, "Created", 201);
    }

    public static ApiResponse<Void> error(String message, int status) {
        return new ApiResponse<>(null, null, message, status);
    }

    public static ApiResponse<Void> error(String code, String message, int status) {
        return new ApiResponse<>(null, code, message, status);
    }

    public static <T> ApiResponse<T> error(T data, String message, int status) {
        return new ApiResponse<>(data, null, message, status);
    }
}
