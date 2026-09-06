package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.request.SaveClassAttendanceRequest;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.ClassAttendanceResponse;
import com.tutorschool.backend.service.ClassAttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;

/**
 * การเช็คชื่อเข้าเรียน (onsite) ที่ติวเตอร์บันทึกเอง — ใช้ในหน้า "การเข้าเรียน" ฝั่งติวเตอร์
 */
@RestController
@RequestMapping("/api/v1/class-attendance")
@RequiredArgsConstructor
public class ClassAttendanceController {

    private final ClassAttendanceService classAttendanceService;

    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ClassAttendanceResponse>>> getCourseAttendance(
            @PathVariable Long courseId,
            Principal principal) {
        return ResponseEntity.ok(ApiResponse.success("Attendance retrieved",
                classAttendanceService.getCourseAttendance(courseId, principal.getName())));
    }

    @PutMapping
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ClassAttendanceResponse>> saveAttendance(
            @Valid @RequestBody SaveClassAttendanceRequest request,
            Principal principal) {
        return ResponseEntity.ok(ApiResponse.success("Attendance saved",
                classAttendanceService.saveAttendance(request, principal.getName())));
    }

    @DeleteMapping("/course/{courseId}/student/{studentId}")
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteAttendance(
            @PathVariable Long courseId,
            @PathVariable Long studentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Principal principal) {
        classAttendanceService.deleteAttendance(courseId, studentId, date, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Attendance deleted"));
    }
}
