package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.EvaluationCriteriaScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvaluationCriteriaScoreRepository extends JpaRepository<EvaluationCriteriaScore, Long> {

    List<EvaluationCriteriaScore> findByEvaluationId(Long evaluationId);

    boolean existsByCriteriaId(Long criteriaId);

    @Query("SELECT AVG(s.score) FROM EvaluationCriteriaScore s " +
            "WHERE s.criteria.id = :criteriaId AND s.evaluation.course.id = :courseId AND s.evaluation.status = 'PUBLISHED'")
    Double findAverageScoreByCriteriaIdAndCourseId(@Param("criteriaId") Long criteriaId, @Param("courseId") Long courseId);
}
