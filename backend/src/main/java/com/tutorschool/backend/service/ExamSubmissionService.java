package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.ManualGradeRequest;
import com.tutorschool.backend.dto.request.SubmitExamRequest;
import com.tutorschool.backend.dto.response.ExamResultResponse;
import com.tutorschool.backend.dto.response.ExamSubmissionResponse;
import com.tutorschool.backend.dto.response.StudentExamResponse;

import java.util.List;

public interface ExamSubmissionService {

    // Student flow
    StudentExamResponse startExam(Long examId, String studentEmail);
    ExamSubmissionResponse submitExam(Long examId, SubmitExamRequest request, String studentEmail);

    // ดูผลสอบของตัวเอง (Student)
    List<ExamSubmissionResponse> getMySubmissions(String studentEmail);
    ExamSubmissionResponse getSubmissionById(Long submissionId, String userEmail);

    // Manual grading (Teacher)
    ExamSubmissionResponse manualGrade(Long submissionId, ManualGradeRequest request, String teacherEmail);

    // Results
    List<ExamResultResponse> getMyResults(String studentEmail);
    List<ExamResultResponse> getResultsByExam(Long examId, String teacherEmail);
    List<ExamResultResponse> getResultsByCourse(Long courseId, String teacherEmail);
}
