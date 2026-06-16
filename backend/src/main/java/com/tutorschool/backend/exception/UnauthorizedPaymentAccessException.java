package com.tutorschool.backend.exception;

public class UnauthorizedPaymentAccessException extends RuntimeException {

    public UnauthorizedPaymentAccessException(String message) {
        super(message);
    }
}
