package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.SaveClassAttendanceRequest;
import com.tutorschool.backend.dto.response.ClassAttendanceResponse;
import com.tutorschool.backend.dto.response.CourseSessionResponse;
import com.tutorschool.backend.entity.User;

import java.time.LocalDate;
import java.util.List;

public interface ClassAttendanceService {

    // ADMIN ดูการเข้าเรียนของทุกคอร์ส (อ่านอย่างเดียว), TUTOR ดูได้เฉพาะคอร์สของตัวเอง
    List<ClassAttendanceResponse> getCourseAttendance(Long courseId, User currentUser);

    // รายการคาบเรียน (คำนวณจากตารางสอนรายสัปดาห์ + วันเริ่มเรียน) ใช้เป็นคอลัมน์ของตารางเช็คชื่อ
    List<CourseSessionResponse> getCourseSessions(Long courseId, User currentUser);

    // นักเรียนดูการเช็คชื่อของตัวเองทุกคอร์ส
    List<ClassAttendanceResponse> getMyAttendance(String studentEmail);

    // การเช็คชื่อของนักเรียนคนหนึ่งทุกคอร์ส ระบุด้วย studentId ตรงๆ — ใช้โดยผู้ปกครองดูของบุตรหลาน
    List<ClassAttendanceResponse> getAttendanceByStudentId(Long studentId);

    // รายการคาบเรียนของคอร์ส สำหรับนักเรียนคนหนึ่ง ระบุด้วย studentId ตรงๆ — ใช้โดยผู้ปกครองดูของบุตรหลาน
    List<CourseSessionResponse> getCourseSessionsForStudent(Long courseId, Long studentId);

    ClassAttendanceResponse saveAttendance(SaveClassAttendanceRequest request, String tutorEmail);

    void deleteAttendance(Long courseId, Long studentId, LocalDate sessionDate, String tutorEmail);
}
