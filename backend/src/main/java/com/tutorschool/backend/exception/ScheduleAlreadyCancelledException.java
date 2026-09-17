package com.tutorschool.backend.exception;

public class ScheduleAlreadyCancelledException extends RuntimeException {
    public ScheduleAlreadyCancelledException(String message) {
        super(message);
    }
}
