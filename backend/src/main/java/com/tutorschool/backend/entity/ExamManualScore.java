package com.tutorschool.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * คะแนนสอบที่ติวเตอร์กรอกเอง — ใช้กับข้อสอบที่ทำผ่านลิงก์ภายนอก (เช่น Google Form)
 * ซึ่งระบบไม่มีการยื่นข้อสอบ (ExamSubmission) จึงไม่มีคะแนนอัตโนมัติ
 * unique (exam_id, student_id) — นักเรียน 1 คนมีคะแนนได้ 1 ค่าต่อการสอบ 1 ครั้ง
 */
@Entity
@Table(
        name = "exam_manual_scores",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_exam_manual_score_exam_student",
                columnNames = {"exam_id", "student_id"}
        )
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamManualScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "score", nullable = false)
    private Double score;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    // อีเมลติวเตอร์ที่กรอก/แก้ไขคะแนนล่าสุด
    @Column(name = "graded_by", length = 150)
    private String gradedBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
