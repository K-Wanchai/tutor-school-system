package com.tutorschool.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "evaluation_settings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "teaching_label", nullable = false, length = 100)
    private String teachingLabel;

    @Column(name = "content_label", nullable = false, length = 100)
    private String contentLabel;

    @Column(name = "material_label", nullable = false, length = 100)
    private String materialLabel;

    @Column(name = "communication_label", nullable = false, length = 100)
    private String communicationLabel;

    @Column(name = "value_label", nullable = false, length = 100)
    private String valueLabel;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
