package com.tutorschool.backend.dto.request;

import com.tutorschool.backend.entity.EducationLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaveSchoolTrackRequest {

    @NotNull(message = "กรุณาเลือกระดับชั้น")
    private EducationLevel educationLevel;

    @NotBlank(message = "กรุณากรอกชื่อสายการเรียน/ห้องเรียน")
    @Size(max = 100, message = "ชื่อสายการเรียน/ห้องเรียนต้องไม่เกิน 100 ตัวอักษร")
    private String name;

    private Boolean active;
}
