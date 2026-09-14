package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.Tutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TutorRepository extends JpaRepository<Tutor, Long> {

    Optional<Tutor> findByUserId(Long userId);

    Optional<Tutor> findByUserEmail(String email);

    boolean existsByUserEmail(String email);

    boolean existsByTutorCode(String tutorCode);

    Page<Tutor> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
            String firstName, String lastName, Pageable pageable);

    // รายงานข้อมูลติวเตอร์ — กรองแบบ nullable-param เหมือน searchForReport ของ Student — กรองตามวันที่สมัคร (createdAt)
    @Query("SELECT t FROM Tutor t " +
            "WHERE t.createdAt >= COALESCE(:dateFrom, t.createdAt) " +
            "AND t.createdAt <= COALESCE(:dateTo, t.createdAt) " +
            "AND t.id = COALESCE(:tutorId, t.id) " +
            "ORDER BY t.createdAt DESC")
    List<Tutor> searchForReport(@Param("dateFrom") LocalDateTime dateFrom,
                                 @Param("dateTo") LocalDateTime dateTo,
                                 @Param("tutorId") Long tutorId);
}
