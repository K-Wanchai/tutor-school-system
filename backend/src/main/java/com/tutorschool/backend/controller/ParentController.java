package com.tutorschool.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.ClassAttendanceResponse;
import com.tutorschool.backend.dto.response.CourseSessionResponse;
import com.tutorschool.backend.dto.response.EnrollmentResponse;
import com.tutorschool.backend.dto.response.ExamManualScoreResponse;
import com.tutorschool.backend.dto.response.ExamResponse;
import com.tutorschool.backend.dto.response.StudentResponse;
import com.tutorschool.backend.entity.Student;
import com.tutorschool.backend.entity.User;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.repository.StudentRepository;
import com.tutorschool.backend.service.ClassAttendanceService;
import com.tutorschool.backend.service.EnrollmentService;
import com.tutorschool.backend.service.ExamScoreService;
import com.tutorschool.backend.service.ExamService;
import com.tutorschool.backend.service.StudentService;

import lombok.RequiredArgsConstructor;

/**
 * เมนูสำหรับผู้ปกครอง — ดูข้อมูลของบุตรหลาน (นักเรียนที่ผูกกับบัญชี PARENT) เท่านั้น อ่านอย่างเดียว
 */
@RestController
@RequestMapping("/api/v1/parent")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PARENT')")
public class ParentController {

    private final StudentRepository studentRepository;
    private final StudentService studentService;
    private final EnrollmentService enrollmentService;
    private final ClassAttendanceService classAttendanceService;
    private final ExamService examService;
    private final ExamScoreService examScoreService;

    private Long childStudentId(User parentUser) {
        Student child = studentRepository.findByParentUserId(parentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ไม่พบข้อมูลนักเรียนที่ผูกกับบัญชีผู้ปกครองนี้"));
        return child.getId();
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<StudentResponse>> getChildProfile(
            @AuthenticationPrincipal User parentUser) {
        StudentResponse response = studentService.getStudentByParentUserId(parentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Child profile retrieved successfully", response));
    }

    @GetMapping("/enrollments")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getChildEnrollments(
            @AuthenticationPrincipal User parentUser) {
        List<EnrollmentResponse> response = enrollmentService.getEnrollmentsByStudentId(childStudentId(parentUser));
        return ResponseEntity.ok(ApiResponse.success("Child enrollments retrieved successfully", response));
    }

    // การเช็คชื่อเข้าเรียนของบุตรหลาน ทุกคอร์ส
    @GetMapping("/attendance")
    public ResponseEntity<ApiResponse<List<ClassAttendanceResponse>>> getChildAttendance(
            @AuthenticationPrincipal User parentUser) {
        List<ClassAttendanceResponse> response =
                classAttendanceService.getAttendanceByStudentId(childStudentId(parentUser));
        return ResponseEntity.ok(ApiResponse.success("Child attendance retrieved successfully", response));
    }

    // รายการคาบเรียนของคอร์สหนึ่ง (คอลัมน์ของตารางเช็คชื่อ) — เฉพาะคอร์สที่บุตรหลานลงทะเบียนอยู่เท่านั้น
    @GetMapping("/courses/{courseId}/sessions")
    public ResponseEntity<ApiResponse<List<CourseSessionResponse>>> getChildCourseSessions(
            @PathVariable Long courseId,
            @AuthenticationPrincipal User parentUser) {
        List<CourseSessionResponse> response =
                classAttendanceService.getCourseSessionsForStudent(courseId, childStudentId(parentUser));
        return ResponseEntity.ok(ApiResponse.success("Course sessions retrieved successfully", response));
    }

    // ตารางสอบของบุตรหลาน ทุกคอร์สที่ลงทะเบียนอยู่
    @GetMapping("/exams")
    public ResponseEntity<ApiResponse<List<ExamResponse>>> getChildExams(
            @AuthenticationPrincipal User parentUser) {
        List<ExamResponse> response = examService.getExamsByStudentId(childStudentId(parentUser));
        return ResponseEntity.ok(ApiResponse.success("Child exams retrieved successfully", response));
    }

    // คะแนนสอบของบุตรหลานในคอร์สหนึ่ง — เฉพาะคอร์สที่บุตรหลานลงทะเบียนอยู่เท่านั้น
    @GetMapping("/courses/{courseId}/exam-scores")
    public ResponseEntity<ApiResponse<List<ExamManualScoreResponse>>> getChildCourseScores(
            @PathVariable Long courseId,
            @AuthenticationPrincipal User parentUser) {
        List<ExamManualScoreResponse> response =
                examScoreService.getCourseScoresForStudent(courseId, childStudentId(parentUser));
        return ResponseEntity.ok(ApiResponse.success("Course scores retrieved successfully", response));
    }
}
