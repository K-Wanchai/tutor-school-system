package com.tutorschool.backend.exception;

public class StudentAchievementNotFoundException extends RuntimeException {
    public StudentAchievementNotFoundException(String message) {
        super(message);
    }
}
