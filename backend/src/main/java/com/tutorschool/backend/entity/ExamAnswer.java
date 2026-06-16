package com.tutorschool.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "exam_answers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    private ExamSubmission submission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private ExamQuestion question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_option_id")
    private ExamQuestionOption selectedOption;

    // สำหรับ SHORT_ANSWER, PARAGRAPH และ CHECKBOX (เก็บ option IDs คั่นด้วย comma)
    @Column(name = "student_answer_text", columnDefinition = "TEXT")
    private String studentAnswerText;

    // nullable — null สำหรับ SHORT_ANSWER/PARAGRAPH ที่รอ manual grading
    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(name = "score_awarded")
    @Builder.Default
    private Double scoreAwarded = 0.0;

    @Column(name = "answered_at")
    private LocalDateTime answeredAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        answeredAt = now;
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
