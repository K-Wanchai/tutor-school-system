package com.tutorschool.backend.exception;

public class ExamNotFoundException extends RuntimeException {

    public ExamNotFoundException(Long id) {
        super("Exam not found with id: " + id);
    }

    public ExamNotFoundException(String examCode) {
        super("Exam not found with code: " + examCode);
    }
}
