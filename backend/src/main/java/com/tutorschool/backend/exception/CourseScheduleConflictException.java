package com.tutorschool.backend.exception;

public class CourseScheduleConflictException extends RuntimeException {

    public CourseScheduleConflictException(String message) {
        super(message);
    }
}
