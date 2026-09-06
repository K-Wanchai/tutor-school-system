package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.SaveExamScoreRequest;
import com.tutorschool.backend.dto.response.ExamManualScoreResponse;
import com.tutorschool.backend.entity.User;

import java.util.List;

public interface ExamScoreService {

    // ADMIN สามารถดูคะแนนของทุกคอร์ส (อ่านอย่างเดียว), TUTOR ดูได้เฉพาะคอร์สของตัวเอง
    List<ExamManualScoreResponse> getCourseScores(Long courseId, User currentUser);

    ExamManualScoreResponse saveScore(SaveExamScoreRequest request, String tutorEmail);

    void deleteScore(Long examId, Long studentId, String tutorEmail);
}
