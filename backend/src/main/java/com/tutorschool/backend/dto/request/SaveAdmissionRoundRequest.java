package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaveAdmissionRoundRequest {

    @NotBlank(message = "กรุณากรอกชื่อรอบที่สอบติด")
    @Size(max = 100, message = "ชื่อรอบที่สอบติดต้องไม่เกิน 100 ตัวอักษร")
    private String name;

    private Boolean active;
}
