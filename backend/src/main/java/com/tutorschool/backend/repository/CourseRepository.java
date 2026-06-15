package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {

    Page<Course> findByActiveTrue(Pageable pageable);

    Page<Course> findByActiveTrueAndNameContainingIgnoreCase(String name, Pageable pageable);

    List<Course> findByTeacherId(Long teacherId);
}
