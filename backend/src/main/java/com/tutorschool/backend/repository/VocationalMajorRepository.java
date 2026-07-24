package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.VocationalMajor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VocationalMajorRepository extends JpaRepository<VocationalMajor, Long> {

    List<VocationalMajor> findByExamInstitutionIdOrderByNameAsc(Long examInstitutionId);

    boolean existsByExamInstitutionIdAndNameIgnoreCase(Long examInstitutionId, String name);

    boolean existsByExamInstitutionIdAndNameIgnoreCaseAndIdNot(Long examInstitutionId, String name, Long id);
}
