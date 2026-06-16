package com.tutorschool.backend.exception;

public class DuplicateAchievementException extends RuntimeException {
    public DuplicateAchievementException(String message) {
        super(message);
    }
}
