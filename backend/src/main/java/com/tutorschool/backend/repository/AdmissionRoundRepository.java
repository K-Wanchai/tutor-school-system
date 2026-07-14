package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.AdmissionRound;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdmissionRoundRepository extends JpaRepository<AdmissionRound, Long> {

    List<AdmissionRound> findByExamInstitutionIdOrderByNameAsc(Long examInstitutionId);

    boolean existsByExamInstitutionIdAndNameIgnoreCase(Long examInstitutionId, String name);

    boolean existsByExamInstitutionIdAndNameIgnoreCaseAndIdNot(Long examInstitutionId, String name, Long id);
}
