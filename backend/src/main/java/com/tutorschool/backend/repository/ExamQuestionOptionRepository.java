package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.ExamQuestionOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamQuestionOptionRepository extends JpaRepository<ExamQuestionOption, Long> {

    List<ExamQuestionOption> findByQuestionIdOrderByOptionOrderAsc(Long questionId);

    // field "correct" (DB column: is_correct) → JPA derives "CorrectTrue"
    List<ExamQuestionOption> findByQuestionIdAndCorrectTrue(Long questionId);
}
