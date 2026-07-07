package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.request.CreateExamRequest;
import com.tutorschool.backend.dto.request.CreateExamQuestionRequest;
import com.tutorschool.backend.dto.request.UpdateExamRequest;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.ExamQuestionResponse;
import com.tutorschool.backend.dto.response.ExamResponse;
import com.tutorschool.backend.entity.User;
import com.tutorschool.backend.service.ExamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;

    // ─── Admin / Tutor endpoints ────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ExamResponse>> createExam(
            @Valid @RequestBody CreateExamRequest request,
            Principal principal) {
        ExamResponse response = examService.createExam(request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Exam created successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ExamResponse>>> getAllExams() {
        return ResponseEntity.ok(ApiResponse.success("Exams retrieved", examService.getAllExams()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ExamResponse>> getExamById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Exam retrieved", examService.getExamById(id)));
    }

    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ExamResponse>>> getExamsByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(ApiResponse.success("Exams retrieved", examService.getExamsByCourse(courseId)));
    }

    @GetMapping("/lesson/{lessonId}")
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ExamResponse>>> getExamsByLesson(@PathVariable Long lessonId) {
        return ResponseEntity.ok(ApiResponse.success("Exams retrieved", examService.getExamsByLesson(lessonId)));
    }

    // Student ดูได้เฉพาะ OPEN exams
    @GetMapping("/course/{courseId}/open")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<ExamResponse>>> getOpenExamsByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(ApiResponse.success("Open exams retrieved", examService.getOpenExamsByCourse(courseId)));
    }

    // ตารางสอบของนักเรียน — รวมทุกคอร์สที่ลงทะเบียนอนุมัติ/เรียนจบแล้ว ไม่ส่งเนื้อหาข้อสอบมาด้วย
    @GetMapping("/student/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<ExamResponse>>> getMyExamsAsStudent(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(
                ApiResponse.success("My exam schedule retrieved", examService.getMyExamsAsStudent(currentUser.getId())));
    }

    // ตารางสอบของติวเตอร์ — ข้อสอบทั้งหมดของคอร์สตัวเอง
    @GetMapping("/tutor/me")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<ApiResponse<List<ExamResponse>>> getMyExamsAsTutor(Principal principal) {
        return ResponseEntity.ok(
                ApiResponse.success("My exam schedule retrieved", examService.getMyExamsAsTutor(principal.getName())));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ExamResponse>> updateExam(
            @PathVariable Long id,
            @Valid @RequestBody UpdateExamRequest request,
            Principal principal) {
        return ResponseEntity.ok(ApiResponse.success("Exam updated", examService.updateExam(id, request, principal.getName())));
    }

    @PatchMapping("/{id}/open")
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ExamResponse>> openExam(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(ApiResponse.success("Exam opened", examService.openExam(id, principal.getName())));
    }

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ExamResponse>> closeExam(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(ApiResponse.success("Exam closed", examService.closeExam(id, principal.getName())));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteExam(@PathVariable Long id, Principal principal) {
        examService.deleteExam(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Exam deleted"));
    }

    // ─── Question management ──────────────────────────────────────────────────

    @PostMapping("/{examId}/questions")
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ExamQuestionResponse>> addQuestion(
            @PathVariable Long examId,
            @Valid @RequestBody CreateExamQuestionRequest request,
            Principal principal) {
        ExamQuestionResponse response = examService.addQuestion(examId, request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Question added successfully", response));
    }
}
