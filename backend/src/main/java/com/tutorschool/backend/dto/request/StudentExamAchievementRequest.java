package com.tutorschool.backend.dto.request;

import com.tutorschool.backend.entity.EducationLevel;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentExamAchievementRequest {

    @NotNull(message = "กรุณาเลือกนักเรียน")
    private Long studentId;

    @NotNull(message = "กรุณาเลือกสถาบันที่สอบติด")
    private Long examInstitutionId;

    /** รหัส Enrollment ของคอร์สที่นักเรียนคนนี้ลงทะเบียนแล้วและเกี่ยวข้องกับผลสอบติดนี้ (ไม่บังคับ) */
    private List<Long> enrollmentIds;

    @NotNull(message = "กรุณาเลือกระดับที่สอบติด")
    private EducationLevel educationLevel;

    /** รหัสสายการเรียน/ห้องเรียน — บังคับเมื่อ educationLevel เป็นมัธยมต้นหรือมัธยมปลาย */
    private Long schoolTrackId;

    /** รหัสสาขา — บังคับเมื่อ educationLevel เป็นปริญญาตรี */
    private Long academicMajorId;

    /** รหัสรอบที่สอบติด — ไม่บังคับ */
    private Long admissionRoundId;

    @NotNull(message = "กรุณากรอกปีการศึกษา")
    private Integer academicYear;

    private LocalDate resultDate;

    private String note;

    private Boolean active;
}
