package com.tutorschool.backend.exception;

public class EnrollmentNotCompletedException extends RuntimeException {

    public EnrollmentNotCompletedException() {
        super("Enrollment must be COMPLETED before submitting an evaluation");
    }

    public EnrollmentNotCompletedException(String message) {
        super(message);
    }
}
