package com.tutorschool.backend.exception;

public class UnauthorizedScheduleAccessException extends RuntimeException {
    public UnauthorizedScheduleAccessException(String message) {
        super(message);
    }
}
