package com.tutorschool.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "evaluation_criteria_scores",
        uniqueConstraints = @UniqueConstraint(columnNames = {"evaluation_id", "criteria_id"}))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationCriteriaScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluation_id", nullable = false)
    private CourseEvaluation evaluation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criteria_id", nullable = false)
    private EvaluationCriteria criteria;

    @Column(nullable = false)
    private Integer score;
}
