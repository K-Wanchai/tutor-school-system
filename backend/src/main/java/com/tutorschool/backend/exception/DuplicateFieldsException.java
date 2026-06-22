package com.tutorschool.backend.exception;

import java.util.Map;

public class DuplicateFieldsException extends RuntimeException {

    private final Map<String, String> errors;

    public DuplicateFieldsException(Map<String, String> errors) {
        super("มีข้อมูลซ้ำในระบบ กรุณาตรวจสอบ");
        this.errors = errors;
    }

    public Map<String, String> getErrors() {
        return errors;
    }
}
