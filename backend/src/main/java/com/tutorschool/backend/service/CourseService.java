package com.tutorschool.backend.service;

import java.util.List;

import com.tutorschool.backend.dto.request.CreateCourseRequest;
import com.tutorschool.backend.dto.request.UpdateCourseRequest;
import com.tutorschool.backend.dto.request.UpdateCourseStatusRequest;
import com.tutorschool.backend.dto.response.CourseCompletionEligibilityResponse;
import com.tutorschool.backend.dto.response.CourseResponse;
import com.tutorschool.backend.dto.response.PageResponse;
import com.tutorschool.backend.dto.response.TutorAvailabilityResponse;
import com.tutorschool.backend.entity.CourseStatus;

import java.time.LocalDate;

public interface CourseService {

    // status/excludeStatus เป็น optional filter (ใส่ได้ทีละอย่าง) — ใช้แยกหน้า "จัดการคอร์สเรียน" (ไม่รวมคอร์สที่สอนจบแล้ว)
    // ออกจากหน้า "ประวัติคอร์สเรียน" (เฉพาะคอร์สที่สอนจบแล้ว) โดยไม่กระทบผู้เรียกเดิมที่ไม่ส่งค่ามา (ได้ทุกสถานะเหมือนเดิม)
    PageResponse<CourseResponse> getAllCourses(int page, int size, CourseStatus status, CourseStatus excludeStatus);

    CourseResponse getCourseById(Long id);

    CourseResponse getCourseByCode(String courseCode);

    List<CourseResponse> getCoursesByTutorId(Long tutorId);

    List<CourseResponse> getCoursesByTutorUserId(Long userId);

    CourseResponse createCourse(CreateCourseRequest request);

    CourseResponse updateCourse(Long id, UpdateCourseRequest request);

    CourseResponse updateCourseStatus(Long id, UpdateCourseStatusRequest request);

    void markCourseViewed(Long courseId, Long tutorUserId);

    CourseResponse completeCourse(Long courseId, Long tutorUserId);

    CourseCompletionEligibilityResponse getCourseCompletionEligibility(Long courseId, Long tutorUserId);

    void deleteCourse(Long id);

    void autoTransitionCourses();

    // ตารางว่าง/ไม่ว่างของติวเตอร์ในวันที่ระบุ — ใช้ตอนแอดมินสร้าง/แก้ไขคอร์สเพื่อดูว่าติวเตอร์
    // มีคอร์สอื่นสอนช่วงเวลาไหนแล้วบ้าง (excludeCourseId ไม่นับคอร์สที่กำลังแก้ไขเอง)
    TutorAvailabilityResponse getTutorAvailability(Long tutorId, LocalDate date, Long excludeCourseId);
}
