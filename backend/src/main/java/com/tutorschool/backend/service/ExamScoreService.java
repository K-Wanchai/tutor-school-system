package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.SaveExamScoreRequest;
import com.tutorschool.backend.dto.response.ExamManualScoreResponse;

import java.util.List;

public interface ExamScoreService {

    List<ExamManualScoreResponse> getCourseScores(Long courseId, String tutorEmail);

    ExamManualScoreResponse saveScore(SaveExamScoreRequest request, String tutorEmail);

    void deleteScore(Long examId, Long studentId, String tutorEmail);
}
