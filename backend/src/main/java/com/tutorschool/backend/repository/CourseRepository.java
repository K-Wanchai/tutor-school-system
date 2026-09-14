package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.Course;
import com.tutorschool.backend.entity.CourseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {

    Optional<Course> findByCourseCode(String courseCode);

    List<Course> findByTutorId(Long tutorId);

    boolean existsByTutorId(Long tutorId);

    Page<Course> findByStatus(CourseStatus status, Pageable pageable);

    Page<Course> findByStatusNot(CourseStatus status, Pageable pageable);

    Page<Course> findByCourseNameContainingIgnoreCase(String courseName, Pageable pageable);

    List<Course> findByStatusAndRegistrationStartDateLessThanEqual(CourseStatus status, LocalDate date);

    List<Course> findByStatusAndRegistrationEndDateLessThan(CourseStatus status, LocalDate date);

    List<Course> findByStatusInAndCourseStartDateLessThanEqual(List<CourseStatus> statuses, LocalDate date);

    // รายงานข้อมูลคอร์สเรียน — กรองแบบ nullable-param เหมือน searchForReport ของ Student/Tutor — กรองตามวันที่สร้างคอร์ส (createdAt)
    @Query("SELECT c FROM Course c " +
            "WHERE c.createdAt >= COALESCE(:dateFrom, c.createdAt) " +
            "AND c.createdAt <= COALESCE(:dateTo, c.createdAt) " +
            "AND c.id = COALESCE(:courseId, c.id) " +
            "AND c.status = COALESCE(:status, c.status) " +
            "ORDER BY c.createdAt ASC")
    List<Course> searchForReport(@Param("dateFrom") LocalDateTime dateFrom,
                                  @Param("dateTo") LocalDateTime dateTo,
                                  @Param("courseId") Long courseId,
                                  @Param("status") CourseStatus status);
}
