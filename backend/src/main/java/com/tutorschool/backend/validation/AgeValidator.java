package com.tutorschool.backend.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.time.LocalDate;
import java.time.Period;

public class AgeValidator implements ConstraintValidator<Age, LocalDate> {

    private int min;
    private int max;

    @Override
    public void initialize(Age constraintAnnotation) {
        this.min = constraintAnnotation.min();
        this.max = constraintAnnotation.max();
    }

    @Override
    public boolean isValid(LocalDate birthDate, ConstraintValidatorContext context) {
        if (birthDate == null) {
            return true; // let @NotNull handle the null case
        }
        int age = Period.between(birthDate, LocalDate.now()).getYears();
        return age >= min && age <= max;
    }
}
