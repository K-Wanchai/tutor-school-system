package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.EducationLevel;
import com.tutorschool.backend.entity.StudentExamAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StudentExamAchievementRepository extends JpaRepository<StudentExamAchievement, Long> {

    List<StudentExamAchievement> findByStudentId(Long studentId);

    List<StudentExamAchievement> findByStudentIdAndActiveTrue(Long studentId);

    List<StudentExamAchievement> findByExamInstitutionId(Long examInstitutionId);

    List<StudentExamAchievement> findByExamInstitutionIdAndActiveTrue(Long examInstitutionId);

    List<StudentExamAchievement> findByExamInstitutionIdAndEducationLevelAndActiveTrue(
            Long examInstitutionId, EducationLevel educationLevel);

    List<StudentExamAchievement> findByEducationLevel(EducationLevel educationLevel);

    List<StudentExamAchievement> findByAcademicYear(Integer academicYear);

    List<StudentExamAchievement> findByActiveTrue();

    boolean existsByStudentIdAndExamInstitutionIdAndEducationLevelAndAcademicYearAndActiveTrue(
            Long studentId, Long examInstitutionId, EducationLevel educationLevel, Integer academicYear);

    boolean existsByStudentIdAndExamInstitutionIdAndEducationLevelAndAcademicYearAndActiveTrueAndIdNot(
            Long studentId, Long examInstitutionId, EducationLevel educationLevel, Integer academicYear, Long id);

    @Query("SELECT a FROM StudentExamAchievement a WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "  LOWER(a.student.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "  LOWER(a.examInstitution.institutionName) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:educationLevel IS NULL OR a.educationLevel = :educationLevel) AND " +
           "(:institutionId IS NULL OR a.examInstitution.id = :institutionId) AND " +
           "(:academicYear IS NULL OR a.academicYear = :academicYear) AND " +
           "(:active IS NULL OR a.active = :active) " +
           "ORDER BY a.academicYear DESC, a.student.fullName ASC")
    List<StudentExamAchievement> searchAchievements(
            @Param("keyword") String keyword,
            @Param("educationLevel") EducationLevel educationLevel,
            @Param("institutionId") Long institutionId,
            @Param("academicYear") Integer academicYear,
            @Param("active") Boolean active);
}
