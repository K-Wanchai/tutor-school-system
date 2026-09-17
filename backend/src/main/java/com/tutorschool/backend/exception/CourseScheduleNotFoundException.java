package com.tutorschool.backend.exception;

public class CourseScheduleNotFoundException extends RuntimeException {
    public CourseScheduleNotFoundException(String message) {
        super(message);
    }
}
