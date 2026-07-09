package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.request.StudentExamAchievementRequest;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.StudentAchievementDetailResponse;
import com.tutorschool.backend.dto.response.StudentExamAchievementResponse;
import com.tutorschool.backend.entity.EducationLevel;
import com.tutorschool.backend.service.StudentExamAchievementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * บันทึกว่านักเรียนคนใดสอบติดสถาบันใด ระดับใด (มัธยมต้น/มัธยมปลาย/มหาวิทยาลัย)
 * และรายละเอียดการเข้าศึกษาต่อ — เฉพาะ ADMIN เท่านั้นที่เข้าถึง endpoint นี้ได้
 *
 * ไม่ใช้ class-level @RequestMapping เนื่องจาก endpoint หนึ่ง (getAchievementsByStudent)
 * อยู่คนละ resource path (/api/v1/admin/students/{studentId}/exam-achievements)
 * จากอีกกลุ่ม endpoint (/api/v1/admin/student-exam-achievements)
 */
@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class StudentExamAchievementController {

    private final StudentExamAchievementService studentExamAchievementService;

    @GetMapping("/api/v1/admin/student-exam-achievements")
    public ResponseEntity<ApiResponse<List<StudentExamAchievementResponse>>> getAchievements(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) EducationLevel educationLevel,
            @RequestParam(required = false) Long institutionId,
            @RequestParam(required = false) Integer academicYear,
            @RequestParam(required = false) Boolean active) {
        List<StudentExamAchievementResponse> data = studentExamAchievementService
                .searchAchievements(keyword, educationLevel, institutionId, academicYear, active);
        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลผลการสอบติดสำเร็จ", data));
    }

    @GetMapping("/api/v1/admin/student-exam-achievements/{id}")
    public ResponseEntity<ApiResponse<StudentExamAchievementResponse>> getAchievementById(@PathVariable Long id) {
        StudentExamAchievementResponse data = studentExamAchievementService.getAchievementById(id);
        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลผลการสอบติดสำเร็จ", data));
    }

    @GetMapping("/api/v1/admin/student-exam-achievements/{id}/detail")
    public ResponseEntity<ApiResponse<StudentAchievementDetailResponse>> getAchievementDetail(@PathVariable Long id) {
        StudentAchievementDetailResponse data = studentExamAchievementService.getStudentAchievementDetail(id);
        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลรายละเอียดผลการสอบติดสำเร็จ", data));
    }

    @PostMapping("/api/v1/admin/student-exam-achievements")
    public ResponseEntity<ApiResponse<StudentExamAchievementResponse>> createAchievement(
            @Valid @RequestBody StudentExamAchievementRequest request) {
        StudentExamAchievementResponse data = studentExamAchievementService.createAchievement(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("เพิ่มผลการสอบติดสำเร็จ", data));
    }

    @PutMapping("/api/v1/admin/student-exam-achievements/{id}")
    public ResponseEntity<ApiResponse<StudentExamAchievementResponse>> updateAchievement(
            @PathVariable Long id,
            @Valid @RequestBody StudentExamAchievementRequest request) {
        StudentExamAchievementResponse data = studentExamAchievementService.updateAchievement(id, request);
        return ResponseEntity.ok(ApiResponse.success("แก้ไขผลการสอบติดสำเร็จ", data));
    }

    @DeleteMapping("/api/v1/admin/student-exam-achievements/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAchievement(@PathVariable Long id) {
        studentExamAchievementService.deleteAchievement(id);
        return ResponseEntity.ok(ApiResponse.success("ลบผลการสอบติดสำเร็จ"));
    }

    @GetMapping("/api/v1/admin/students/{studentId}/exam-achievements")
    public ResponseEntity<ApiResponse<List<StudentExamAchievementResponse>>> getAchievementsByStudent(
            @PathVariable Long studentId) {
        List<StudentExamAchievementResponse> data = studentExamAchievementService.getAchievementsByStudent(studentId);
        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลผลการสอบติดของนักเรียนสำเร็จ", data));
    }
}
