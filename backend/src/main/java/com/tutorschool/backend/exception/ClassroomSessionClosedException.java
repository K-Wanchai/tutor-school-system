package com.tutorschool.backend.exception;

public class ClassroomSessionClosedException extends RuntimeException {

    public ClassroomSessionClosedException(String message) {
        super(message);
    }

    public ClassroomSessionClosedException(Long sessionId) {
        super("Classroom session with id " + sessionId + " is not open for joining");
    }
}
