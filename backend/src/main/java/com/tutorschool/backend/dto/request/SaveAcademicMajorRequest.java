package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaveAcademicMajorRequest {

    @NotBlank(message = "กรุณากรอกชื่อสาขา")
    @Size(max = 200, message = "ชื่อสาขาต้องไม่เกิน 200 ตัวอักษร")
    private String name;

    private Boolean active;
}
