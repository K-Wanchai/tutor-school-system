package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.TestQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TestQuestionRepository extends JpaRepository<TestQuestion, Long> {
    List<TestQuestion> findByCourseTestIdOrderByQuestionOrderAsc(Long courseTestId);
    int countByCourseTestId(Long courseTestId);
}
