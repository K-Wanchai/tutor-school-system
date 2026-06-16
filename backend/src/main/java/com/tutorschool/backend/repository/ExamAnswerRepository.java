package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.ExamAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamAnswerRepository extends JpaRepository<ExamAnswer, Long> {

    List<ExamAnswer> findBySubmissionId(Long submissionId);

    Optional<ExamAnswer> findBySubmissionIdAndQuestionId(Long submissionId, Long questionId);
}
