package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.AcademicMajor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AcademicMajorRepository extends JpaRepository<AcademicMajor, Long> {

    List<AcademicMajor> findByFacultyIdOrderByNameAsc(Long facultyId);

    boolean existsByFacultyIdAndNameIgnoreCase(Long facultyId, String name);

    boolean existsByFacultyIdAndNameIgnoreCaseAndIdNot(Long facultyId, String name, Long id);
}
