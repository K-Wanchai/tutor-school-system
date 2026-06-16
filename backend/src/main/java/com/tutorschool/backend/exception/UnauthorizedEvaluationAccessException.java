package com.tutorschool.backend.exception;

public class UnauthorizedEvaluationAccessException extends RuntimeException {

    public UnauthorizedEvaluationAccessException() {
        super("You are not authorized to access or modify this evaluation");
    }

    public UnauthorizedEvaluationAccessException(String message) {
        super(message);
    }
}
