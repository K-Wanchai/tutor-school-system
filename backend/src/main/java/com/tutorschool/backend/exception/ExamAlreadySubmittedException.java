package com.tutorschool.backend.exception;

public class ExamAlreadySubmittedException extends RuntimeException {

    public ExamAlreadySubmittedException(Long submissionId) {
        super("Exam submission already completed. Submission id: " + submissionId);
    }
}
