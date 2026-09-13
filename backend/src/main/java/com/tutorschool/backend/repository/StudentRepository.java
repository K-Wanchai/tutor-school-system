package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByUserId(Long userId);

    Optional<Student> findByNationalId(String nationalId);

    Optional<Student> findByParentUserId(Long parentUserId);

    Optional<Student> findByStudentCode(String studentCode);

    boolean existsByStudentCode(String studentCode);

    boolean existsByStudentCodeAndIdNot(String studentCode, Long id);

    boolean existsByNationalId(String nationalId);

    boolean existsByNationalIdAndIdNot(String nationalId, Long id);

    boolean existsByUserEmail(String email);

    Page<Student> findByFullNameContainingIgnoreCase(String fullName, Pageable pageable);

    @Query("SELECT s FROM Student s WHERE " +
           "LOWER(s.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.studentCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.user.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.user.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "s.phoneNumber LIKE CONCAT('%', :keyword, '%')")
    Page<Student> searchStudents(@Param("keyword") String keyword, Pageable pageable);

    // รายงานข้อมูลนักเรียน — กรองแบบ nullable-param (พารามิเตอร์ไหนไม่ส่งมาก็ไม่ถูกใช้กรอง) ด้วย
    // COALESCE(:param, field) เหมือน searchForReport ของ Enrollment/Payment — กรองตามวันที่สมัคร (createdAt)
    @Query("SELECT s FROM Student s " +
            "WHERE s.createdAt >= COALESCE(:dateFrom, s.createdAt) " +
            "AND s.createdAt <= COALESCE(:dateTo, s.createdAt) " +
            "AND s.id = COALESCE(:studentId, s.id) " +
            "ORDER BY s.createdAt DESC")
    List<Student> searchForReport(@Param("dateFrom") LocalDateTime dateFrom,
                                   @Param("dateTo") LocalDateTime dateTo,
                                   @Param("studentId") Long studentId);
}
