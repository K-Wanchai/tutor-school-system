package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.AcademicFaculty;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AcademicFacultyRepository extends JpaRepository<AcademicFaculty, Long> {

    List<AcademicFaculty> findByExamInstitutionIdOrderByNameAsc(Long examInstitutionId);

    boolean existsByExamInstitutionIdAndNameIgnoreCase(Long examInstitutionId, String name);

    boolean existsByExamInstitutionIdAndNameIgnoreCaseAndIdNot(Long examInstitutionId, String name, Long id);
}
