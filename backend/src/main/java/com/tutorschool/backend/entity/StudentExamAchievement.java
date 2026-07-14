package com.tutorschool.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "student_exam_achievements")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentExamAchievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_institution_id", nullable = false)
    private ExamInstitution examInstitution;

    /** คอร์สที่นักเรียนเคยลงทะเบียนเรียน ซึ่งเกี่ยวข้องกับผลสอบติดนี้ (เลือกได้เฉพาะคอร์สที่นักเรียนคนนี้ลงทะเบียนแล้วเท่านั้น) */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "student_exam_achievement_enrollments",
            joinColumns = @JoinColumn(name = "achievement_id"),
            inverseJoinColumns = @JoinColumn(name = "enrollment_id")
    )
    @Builder.Default
    private List<Enrollment> enrollments = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "education_level", nullable = false, length = 30)
    private EducationLevel educationLevel;

    /** ใช้เมื่อ educationLevel เป็นมัธยมต้นหรือมัธยมปลาย — เลือกจากข้อมูลพื้นฐานที่ตั้งค่าไว้ล่วงหน้าของสถาบันนั้น */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_track_id")
    private SchoolTrack schoolTrack;

    /** ใช้เมื่อ educationLevel เป็นปริญญาตรี — เลือกจากข้อมูลพื้นฐานที่ตั้งค่าไว้ล่วงหน้าของสถาบันนั้น */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_major_id")
    private AcademicMajor academicMajor;

    /** เลือกจากรอบที่สอบติดที่ตั้งค่าไว้ล่วงหน้าของสถาบันนั้น (ไม่บังคับ) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admission_round_id")
    private AdmissionRound admissionRound;

    @Column(name = "academic_year")
    private Integer academicYear;

    @Column(name = "result_date")
    private LocalDate resultDate;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (active == null) {
            active = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
