package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.ExamInstitution;
import com.tutorschool.backend.entity.InstitutionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ExamInstitutionRepository extends JpaRepository<ExamInstitution, Long> {

    Optional<ExamInstitution> findByInstitutionCode(String institutionCode);

    boolean existsByInstitutionCode(String institutionCode);

    boolean existsByInstitutionNameIgnoreCase(String institutionName);

    boolean existsByInstitutionNameIgnoreCaseAndIdNot(String institutionName, Long id);

    List<ExamInstitution> findByActiveTrue();

    @Query("SELECT e FROM ExamInstitution e WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "  LOWER(e.institutionName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "  LOWER(e.province) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:type IS NULL OR e.institutionType = :type) AND " +
           "(:active IS NULL OR e.active = :active) " +
           "ORDER BY e.institutionName ASC")
    List<ExamInstitution> searchExamInstitutions(
            @Param("keyword") String keyword,
            @Param("type") InstitutionType type,
            @Param("active") Boolean active);
}
