package com.tutorschool.backend.exception;

public class EvaluationAlreadyExistsException extends RuntimeException {

    public EvaluationAlreadyExistsException() {
        super("You have already submitted an evaluation for this course");
    }

    public EvaluationAlreadyExistsException(String message) {
        super(message);
    }
}
