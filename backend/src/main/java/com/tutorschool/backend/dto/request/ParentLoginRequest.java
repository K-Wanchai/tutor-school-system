package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ParentLoginRequest {

    @NotBlank(message = "กรุณากรอกเลขบัตรประชาชนของนักเรียน")
    @Pattern(regexp = "\\d{13}", message = "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก")
    private String nationalId;
}
