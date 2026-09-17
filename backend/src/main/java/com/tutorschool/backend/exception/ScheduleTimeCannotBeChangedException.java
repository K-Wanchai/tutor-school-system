package com.tutorschool.backend.exception;

public class ScheduleTimeCannotBeChangedException extends RuntimeException {
    public ScheduleTimeCannotBeChangedException(String message) {
        super(message);
    }
}
