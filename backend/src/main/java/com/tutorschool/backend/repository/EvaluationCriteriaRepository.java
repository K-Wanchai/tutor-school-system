package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.EvaluationCriteria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EvaluationCriteriaRepository extends JpaRepository<EvaluationCriteria, Long> {

    List<EvaluationCriteria> findAllByOrderByDisplayOrderAsc();

    List<EvaluationCriteria> findAllByIsActiveTrueOrderByDisplayOrderAsc();

    Optional<EvaluationCriteria> findTopByOrderByDisplayOrderDesc();
}
