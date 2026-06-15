package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.CourseTest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseTestRepository extends JpaRepository<CourseTest, Long> {

    List<CourseTest> findByCourseIdOrderByTestOrderAsc(Long courseId);
}
