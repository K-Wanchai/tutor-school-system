package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.Course;
import com.tutorschool.backend.entity.CourseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {

    Optional<Course> findByCourseCode(String courseCode);

    boolean existsByCourseCode(String courseCode);

    boolean existsByCourseCodeAndIdNot(String courseCode, Long id);

    List<Course> findByTutorId(Long tutorId);

    Page<Course> findByStatus(CourseStatus status, Pageable pageable);

    Page<Course> findByCourseNameContainingIgnoreCase(String courseName, Pageable pageable);
}
