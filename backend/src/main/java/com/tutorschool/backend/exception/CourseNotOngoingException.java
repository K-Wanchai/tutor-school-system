package com.tutorschool.backend.exception;

public class CourseNotOngoingException extends RuntimeException {

    public CourseNotOngoingException(String message) {
        super(message);
    }
}
