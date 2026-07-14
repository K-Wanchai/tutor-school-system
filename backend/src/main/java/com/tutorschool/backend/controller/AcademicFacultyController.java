package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.request.SaveAcademicFacultyRequest;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.AcademicFacultyResponse;
import com.tutorschool.backend.service.AcademicFacultyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * จัดการข้อมูลพื้นฐาน "คณะ" ของสถาบันประเภทมหาวิทยาลัย เฉพาะ ADMIN เท่านั้นที่เข้าถึงได้
 */
@RestController
@RequestMapping("/api/v1/admin/exam-institutions/{institutionId}/faculties")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AcademicFacultyController {

    private final AcademicFacultyService academicFacultyService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AcademicFacultyResponse>>> getFaculties(@PathVariable Long institutionId) {
        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลคณะสำเร็จ", academicFacultyService.getFaculties(institutionId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AcademicFacultyResponse>> createFaculty(
            @PathVariable Long institutionId,
            @Valid @RequestBody SaveAcademicFacultyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("เพิ่มคณะสำเร็จ", academicFacultyService.createFaculty(institutionId, request)));
    }

    @PutMapping("/{facultyId}")
    public ResponseEntity<ApiResponse<AcademicFacultyResponse>> updateFaculty(
            @PathVariable Long institutionId,
            @PathVariable Long facultyId,
            @Valid @RequestBody SaveAcademicFacultyRequest request) {
        return ResponseEntity.ok(ApiResponse.success("แก้ไขคณะสำเร็จ",
                academicFacultyService.updateFaculty(institutionId, facultyId, request)));
    }

    @DeleteMapping("/{facultyId}")
    public ResponseEntity<ApiResponse<Void>> deleteFaculty(
            @PathVariable Long institutionId,
            @PathVariable Long facultyId) {
        academicFacultyService.deleteFaculty(institutionId, facultyId);
        return ResponseEntity.ok(ApiResponse.success("ปิดใช้งานคณะสำเร็จ"));
    }
}
