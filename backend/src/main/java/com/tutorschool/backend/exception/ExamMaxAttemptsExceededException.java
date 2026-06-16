package com.tutorschool.backend.exception;

public class ExamMaxAttemptsExceededException extends RuntimeException {

    public ExamMaxAttemptsExceededException(int maxAttempts) {
        super("Maximum number of attempts (" + maxAttempts + ") exceeded for this exam");
    }
}
