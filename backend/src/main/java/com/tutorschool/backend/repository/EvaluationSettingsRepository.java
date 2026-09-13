package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.EvaluationSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EvaluationSettingsRepository extends JpaRepository<EvaluationSettings, Long> {

    Optional<EvaluationSettings> findFirstBy();
}
