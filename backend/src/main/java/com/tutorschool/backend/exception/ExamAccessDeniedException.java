package com.tutorschool.backend.exception;

public class ExamAccessDeniedException extends RuntimeException {

    public ExamAccessDeniedException(String message) {
        super(message);
    }
}
