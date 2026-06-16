package com.tutorschool.backend.exception;

public class StudentNotEnrolledException extends RuntimeException {

    public StudentNotEnrolledException(String message) {
        super(message);
    }

    public StudentNotEnrolledException(Long studentId, Long courseId) {
        super("Student with id " + studentId + " is not enrolled in course with id " + courseId);
    }
}
