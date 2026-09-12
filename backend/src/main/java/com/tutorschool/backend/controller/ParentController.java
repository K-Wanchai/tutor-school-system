package com.tutorschool.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.EnrollmentResponse;
import com.tutorschool.backend.dto.response.StudentResponse;
import com.tutorschool.backend.entity.Student;
import com.tutorschool.backend.entity.User;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.repository.StudentRepository;
import com.tutorschool.backend.service.EnrollmentService;
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
}
