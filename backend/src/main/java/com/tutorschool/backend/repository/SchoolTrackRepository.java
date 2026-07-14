package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.EducationLevel;
import com.tutorschool.backend.entity.SchoolTrack;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SchoolTrackRepository extends JpaRepository<SchoolTrack, Long> {

    List<SchoolTrack> findByExamInstitutionIdOrderByNameAsc(Long examInstitutionId);

    List<SchoolTrack> findByExamInstitutionIdAndEducationLevelOrderByNameAsc(
            Long examInstitutionId, EducationLevel educationLevel);

    boolean existsByExamInstitutionIdAndEducationLevelAndNameIgnoreCase(
            Long examInstitutionId, EducationLevel educationLevel, String name);

    boolean existsByExamInstitutionIdAndEducationLevelAndNameIgnoreCaseAndIdNot(
            Long examInstitutionId, EducationLevel educationLevel, String name, Long id);
}
