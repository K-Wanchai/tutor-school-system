package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.*;
import com.tutorschool.backend.dto.response.*;

import java.util.List;

public interface ExamService {

    // Exam CRUD
    ExamResponse createExam(CreateExamRequest request, String teacherEmail);
    ExamResponse getExamById(Long id);
    List<ExamResponse> getAllExams();
    List<ExamResponse> getExamsByCourse(Long courseId);
    List<ExamResponse> getExamsByLesson(Long lessonId);
    ExamResponse updateExam(Long id, UpdateExamRequest request, String teacherEmail);
    ExamResponse openExam(Long id, String teacherEmail);
    ExamResponse closeExam(Long id, String teacherEmail);
    void deleteExam(Long id, String teacherEmail);

    // Student view — ไม่มีเฉลย
    List<ExamResponse> getOpenExamsByCourse(Long courseId);

    // ตารางสอบ
    List<ExamResponse> getMyExamsAsStudent(Long studentUserId);
    List<ExamResponse> getMyExamsAsTutor(String teacherEmail);

    // เรียกโดย ExamScheduler — เปิด/ปิดข้อสอบอัตโนมัติตาม startTime/endTime ที่ตั้งไว้
    void autoTransitionExams();

    // Question management
    ExamQuestionResponse addQuestion(Long examId, CreateExamQuestionRequest request, String teacherEmail);
    ExamQuestionResponse updateQuestion(Long questionId, UpdateExamQuestionRequest request, String teacherEmail);
    void deleteQuestion(Long questionId, String teacherEmail);

    // Option management
    QuestionOptionResponse addOption(Long questionId, CreateQuestionOptionRequest request, String teacherEmail);
    QuestionOptionResponse updateOption(Long optionId, UpdateQuestionOptionRequest request, String teacherEmail);
    void deleteOption(Long optionId, String teacherEmail);
}
