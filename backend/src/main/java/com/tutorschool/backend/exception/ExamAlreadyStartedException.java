package com.tutorschool.backend.exception;

public class ExamAlreadyStartedException extends RuntimeException {

    public ExamAlreadyStartedException(Long examId) {
        super("You already have an exam in progress. Exam id: " + examId);
    }
}
