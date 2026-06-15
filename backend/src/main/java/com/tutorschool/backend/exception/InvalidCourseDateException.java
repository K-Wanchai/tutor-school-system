package com.tutorschool.backend.exception;

public class InvalidCourseDateException extends RuntimeException {

    public InvalidCourseDateException(String message) {
        super(message);
    }
}
