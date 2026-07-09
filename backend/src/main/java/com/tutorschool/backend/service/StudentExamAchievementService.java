package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.StudentExamAchievementRequest;
import com.tutorschool.backend.dto.response.StudentAchievementDetailResponse;
import com.tutorschool.backend.dto.response.StudentExamAchievementResponse;
import com.tutorschool.backend.entity.EducationLevel;

import java.util.List;

public interface StudentExamAchievementService {

    StudentExamAchievementResponse createAchievement(StudentExamAchievementRequest request);

    List<StudentExamAchievementResponse> getAllAchievements();

    StudentExamAchievementResponse getAchievementById(Long id);

    StudentExamAchievementResponse updateAchievement(Long id, StudentExamAchievementRequest request);

    void deleteAchievement(Long id);

    List<StudentExamAchievementResponse> getAchievementsByStudent(Long studentId);

    List<StudentExamAchievementResponse> searchAchievements(
            String keyword, EducationLevel educationLevel, Long institutionId, Integer academicYear, Boolean active);

    StudentAchievementDetailResponse getStudentAchievementDetail(Long achievementId);
}
