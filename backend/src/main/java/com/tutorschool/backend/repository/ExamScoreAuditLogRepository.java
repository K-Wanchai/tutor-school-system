package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.ExamScoreAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamScoreAuditLogRepository extends JpaRepository<ExamScoreAuditLog, Long> {

    List<ExamScoreAuditLog> findBySubmissionId(Long submissionId);

    void deleteBySubmissionIdIn(List<Long> submissionIds);
}
