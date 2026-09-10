package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.SaveClassAttendanceRequest;
import com.tutorschool.backend.dto.response.ClassAttendanceResponse;
import com.tutorschool.backend.entity.User;

import java.time.LocalDate;
import java.util.List;

public interface ClassAttendanceService {

    // ADMIN ดูการเข้าเรียนของทุกคอร์ส (อ่านอย่างเดียว), TUTOR ดูได้เฉพาะคอร์สของตัวเอง
    List<ClassAttendanceResponse> getCourseAttendance(Long courseId, User currentUser);

    // นักเรียนดูการเช็คชื่อของตัวเองทุกคอร์ส
    List<ClassAttendanceResponse> getMyAttendance(String studentEmail);

    ClassAttendanceResponse saveAttendance(SaveClassAttendanceRequest request, String tutorEmail);

    void deleteAttendance(Long courseId, Long studentId, LocalDate sessionDate, String tutorEmail);
}
