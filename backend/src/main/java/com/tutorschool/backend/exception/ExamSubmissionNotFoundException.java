package com.tutorschool.backend.exception;

public class ExamSubmissionNotFoundException extends RuntimeException {

    public ExamSubmissionNotFoundException(Long id) {
        super("Exam submission not found with id: " + id);
    }
}
