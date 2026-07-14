package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.request.SaveSchoolTrackRequest;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.SchoolTrackResponse;
import com.tutorschool.backend.entity.EducationLevel;
import com.tutorschool.backend.service.SchoolTrackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * จัดการข้อมูลพื้นฐาน "สายการเรียน/ห้องเรียน" ของสถาบันประเภทโรงเรียน เฉพาะ ADMIN เท่านั้นที่เข้าถึงได้
 */
@RestController
@RequestMapping("/api/v1/admin/exam-institutions/{institutionId}/school-tracks")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SchoolTrackController {

    private final SchoolTrackService schoolTrackService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SchoolTrackResponse>>> getTracks(
            @PathVariable Long institutionId,
            @RequestParam(required = false) EducationLevel educationLevel) {
        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลสายการเรียน/ห้องเรียนสำเร็จ",
                schoolTrackService.getTracks(institutionId, educationLevel)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SchoolTrackResponse>> createTrack(
            @PathVariable Long institutionId,
            @Valid @RequestBody SaveSchoolTrackRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("เพิ่มสายการเรียน/ห้องเรียนสำเร็จ",
                        schoolTrackService.createTrack(institutionId, request)));
    }

    @PutMapping("/{trackId}")
    public ResponseEntity<ApiResponse<SchoolTrackResponse>> updateTrack(
            @PathVariable Long institutionId,
            @PathVariable Long trackId,
            @Valid @RequestBody SaveSchoolTrackRequest request) {
        return ResponseEntity.ok(ApiResponse.success("แก้ไขสายการเรียน/ห้องเรียนสำเร็จ",
                schoolTrackService.updateTrack(institutionId, trackId, request)));
    }

    @DeleteMapping("/{trackId}")
    public ResponseEntity<ApiResponse<Void>> deleteTrack(
            @PathVariable Long institutionId,
            @PathVariable Long trackId) {
        schoolTrackService.deleteTrack(institutionId, trackId);
        return ResponseEntity.ok(ApiResponse.success("ปิดใช้งานสายการเรียน/ห้องเรียนสำเร็จ"));
    }
}
