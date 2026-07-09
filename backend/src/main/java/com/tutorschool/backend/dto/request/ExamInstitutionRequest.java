package com.tutorschool.backend.dto.request;

import com.tutorschool.backend.entity.InstitutionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamInstitutionRequest {

    @NotBlank(message = "กรุณากรอกชื่อสถาบัน")
    @Size(max = 255, message = "ชื่อสถาบันต้องไม่เกิน 255 ตัวอักษร")
    private String institutionName;

    @NotNull(message = "กรุณาเลือกประเภทสถาบัน")
    private InstitutionType institutionType;

    @Size(max = 100, message = "จังหวัดต้องไม่เกิน 100 ตัวอักษร")
    private String province;

    @Size(max = 100, message = "อำเภอ/เขตต้องไม่เกิน 100 ตัวอักษร")
    private String district;

    private String address;

    @Pattern(regexp = "^$|^https?://.+", message = "รูปแบบเว็บไซต์ไม่ถูกต้อง ต้องขึ้นต้นด้วย http:// หรือ https://")
    private String websiteUrl;

    private String description;

    private Boolean active;
}
