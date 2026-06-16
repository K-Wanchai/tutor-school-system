package com.tutorschool.backend.exception;

public class InvalidSessionTimeException extends RuntimeException {

    public InvalidSessionTimeException(String message) {
        super(message);
    }
}
