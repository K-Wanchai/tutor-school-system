package com.tutorschool.backend.exception;

public class UnauthorizedAchievementAccessException extends RuntimeException {
    public UnauthorizedAchievementAccessException(String message) {
        super(message);
    }
}
