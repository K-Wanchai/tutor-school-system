package com.tutorschool.backend.exception;

public class CourseEvaluationNotFoundException extends RuntimeException {

    public CourseEvaluationNotFoundException(Long id) {
        super("Course evaluation not found with id: " + id);
    }

    public CourseEvaluationNotFoundException(String message) {
        super(message);
    }
}
