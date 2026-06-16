package com.tutorschool.backend.exception;

public class ExamNotOpenException extends RuntimeException {

    public ExamNotOpenException(Long examId) {
        super("Exam is not open for taking. Exam id: " + examId);
    }

    public ExamNotOpenException(String message) {
        super(message);
    }
}
