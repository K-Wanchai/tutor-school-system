package com.tutorschool.backend.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tutorschool.backend.dto.request.CourseLessonRequest;
import com.tutorschool.backend.dto.request.CourseTestRequest;
import com.tutorschool.backend.dto.request.CreateCourseRequest;
import com.tutorschool.backend.dto.request.CreateNotificationRequest;
import com.tutorschool.backend.dto.request.ScheduleDaySlotRequest;
import com.tutorschool.backend.dto.request.UpdateCourseRequest;
import com.tutorschool.backend.dto.request.UpdateCourseStatusRequest;
import com.tutorschool.backend.dto.response.CourseResponse;
import com.tutorschool.backend.dto.response.PageResponse;
import com.tutorschool.backend.entity.Course;
import com.tutorschool.backend.entity.CourseLesson;
import com.tutorschool.backend.entity.CourseScheduleDay;
import com.tutorschool.backend.entity.CourseStatus;
import com.tutorschool.backend.entity.CourseTest;
import com.tutorschool.backend.entity.EnrollmentStatus;
import com.tutorschool.backend.entity.NotificationType;
import com.tutorschool.backend.entity.ReferenceType;
import com.tutorschool.backend.entity.Tutor;
import com.tutorschool.backend.exception.CourseScheduleConflictException;
import com.tutorschool.backend.exception.InvalidCourseDateException;
import com.tutorschool.backend.exception.ResourceInUseException;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.mapper.CourseMapper;
import com.tutorschool.backend.repository.AttendanceRecordRepository;
import com.tutorschool.backend.repository.ClassroomSessionRepository;
import com.tutorschool.backend.repository.CourseEvaluationRepository;
import com.tutorschool.backend.repository.CourseRepository;
import com.tutorschool.backend.repository.CourseScheduleDayRepository;
import com.tutorschool.backend.repository.CourseScheduleRepository;
import com.tutorschool.backend.repository.EnrollmentRepository;
import com.tutorschool.backend.repository.ExamRepository;
import com.tutorschool.backend.repository.TutorRepository;
import com.tutorschool.backend.util.ScheduleDaysParser;
import com.tutorschool.backend.service.CourseService;
import com.tutorschool.backend.service.NotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final TutorRepository TutorRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ExamRepository examRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final ClassroomSessionRepository classroomSessionRepository;
    private final CourseEvaluationRepository courseEvaluationRepository;
    private final CourseScheduleRepository courseScheduleRepository;
    private final CourseScheduleDayRepository courseScheduleDayRepository;
    private final CourseMapper courseMapper;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CourseResponse> getAllCourses(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Course> coursePage = courseRepository.findAll(pageable);
        Page<CourseResponse> responsePage = coursePage.map(course -> {
            long count = enrollmentRepository.countByCourseIdAndStatusIn(course.getId(),
                    List.of(EnrollmentStatus.PENDING, EnrollmentStatus.APPROVED));
            return courseMapper.toSummaryResponse(course, count);
        });
        return PageResponse.from(responsePage);
    }

    @Override
    @Transactional(readOnly = true)
    public CourseResponse getCourseById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", id));
        long enrolledCount = enrollmentRepository.countByCourseIdAndStatusIn(id,
                List.of(EnrollmentStatus.PENDING, EnrollmentStatus.APPROVED));
        return courseMapper.toDetailResponse(course, enrolledCount);
    }

    @Override
    @Transactional(readOnly = true)
    public CourseResponse getCourseByCode(String courseCode) {
        Course course = courseRepository.findByCourseCode(courseCode)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with code: " + courseCode));
        long enrolledCount = enrollmentRepository.countByCourseIdAndStatusIn(course.getId(),
                List.of(EnrollmentStatus.PENDING, EnrollmentStatus.APPROVED));
        return courseMapper.toDetailResponse(course, enrolledCount);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseResponse> getCoursesByTutorId(Long tutorId) {
        if (!TutorRepository.existsById(tutorId)) {
            throw new ResourceNotFoundException("Tutor", tutorId);
        }
        return courseRepository.findByTutorId(tutorId).stream()
                .map(course -> {
                    long count = enrollmentRepository.countByCourseIdAndStatusIn(course.getId(),
                            List.of(EnrollmentStatus.PENDING, EnrollmentStatus.APPROVED));
                    return courseMapper.toSummaryResponse(course, count);
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseResponse> getCoursesByTutorUserId(Long userId) {
        Tutor tutor = TutorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tutor profile not found for user", userId));
        return courseRepository.findByTutorId(tutor.getId()).stream()
                .map(course -> {
                    long count = enrollmentRepository.countByCourseIdAndStatusIn(course.getId(),
                            List.of(EnrollmentStatus.PENDING, EnrollmentStatus.APPROVED));
                    return courseMapper.toDetailResponse(course, count);
                })
                .toList();
    }

    @Override
    @Transactional
    public CourseResponse createCourse(CreateCourseRequest request) {
        Tutor tutor = TutorRepository.findById(request.getTutorId())
                .orElseThrow(() -> new ResourceNotFoundException("Tutor", request.getTutorId()));

        validateCourseDates(request.getRegistrationStartDate(),
                request.getRegistrationEndDate(),
                request.getCourseStartDate());

        BigDecimal price = (request.getPrice() != null) ? request.getPrice() : BigDecimal.ZERO;

        // แอดมินเลือกวัน-เวลาสอนเอง — ต้องไม่ชนกับคอร์สอื่นของติวเตอร์คนเดียวกัน
        List<ScheduleDaySlotRequest> scheduleDays = request.getScheduleDays();
        validateNoScheduleConflict(tutor.getId(), scheduleDays, null);
        validateStartDateMatchesSchedule(request.getCourseStartDate(), scheduleDays);

        CourseStatus initialStatus = resolveAutoStatus(LocalDate.now(),
                request.getRegistrationStartDate(), request.getRegistrationEndDate());

        Course course = Course.builder()
                .courseName(request.getCourseName())
                .price(price)
                .description(request.getDescription())
                .totalHours(request.getTotalHours())
                .seatLimit(request.getSeatLimit())
                .registrationStartDate(request.getRegistrationStartDate())
                .registrationEndDate(request.getRegistrationEndDate())
                .courseStartDate(request.getCourseStartDate())
                .status(initialStatus)
                .tutorViewed(false)
                .tutor(tutor)
                .build();

        addLessonsToCoure(course, request.getLessons());
        addTestsToCourse(course, request.getTests());
        addScheduleDayPatterns(course, scheduleDays);

        course = courseRepository.save(course);

        // รหัสคอร์สอิงจาก id ในฐานข้อมูล เรียงลำดับตามลำดับสร้าง แก้ไขไม่ได้ (เหมือน ENR-/EXM-)
        course.setCourseCode("CRS-" + String.format("%04d", course.getId()));
        course = courseRepository.save(course);

        sendCourseAssignedNotification(course, tutor);

        return courseMapper.toDetailResponse(course, 0L);
    }

    /**
     * Validates that the admin-chosen weekly schedule slots do not overlap, on any shared day,
     * with the SAME tutor's other existing courses. excludeCourseId lets the update-course flow
     * exclude the course being edited from its own conflict check.
     *
     * ตรวจด้วย SQL ตรงๆ ผ่าน CourseScheduleDayRepository#findOverlapping (ตาราง course_schedule_days)
     * ไม่มีการ parse string ใดๆ แล้ว — รับ slot ที่แอดมินเลือกมาเป็น list ตรงๆ จาก request
     */
    private void validateNoScheduleConflict(Long tutorId, List<ScheduleDaySlotRequest> scheduleDays, Long excludeCourseId) {
        for (ScheduleDaySlotRequest slot : scheduleDays) {
            List<CourseScheduleDay> overlapping = courseScheduleDayRepository.findOverlapping(
                    tutorId, slot.getDayOfWeek(), slot.getStartTime(), slot.getEndTime(), excludeCourseId);

            if (!overlapping.isEmpty()) {
                CourseScheduleDay conflict = overlapping.get(0);
                throw new CourseScheduleConflictException(
                        "วัน-เวลาที่เลือกชนกับคอร์ส \"" + conflict.getCourse().getCourseName() + "\" ของติวเตอร์คนนี้ ("
                                + slot.getDayOfWeek() + " " + conflict.getStartTime() + "-" + conflict.getEndTime() + ")");
            }
        }
    }

    /**
     * เพิ่มแถว course_schedule_days ให้ตรงกับ slot ที่แอดมินเลือก — เรียกตอนสร้าง/แก้ไขคอร์ส
     * (คู่กับ course.getScheduleDayPatterns().clear() ตอน update)
     */
    private void addScheduleDayPatterns(Course course, List<ScheduleDaySlotRequest> scheduleDays) {
        for (ScheduleDaySlotRequest slot : scheduleDays) {
            course.getScheduleDayPatterns().add(CourseScheduleDay.builder()
                    .course(course)
                    .dayOfWeek(slot.getDayOfWeek().toUpperCase())
                    .startTime(slot.getStartTime())
                    .endTime(slot.getEndTime())
                    .build());
        }
    }

    private void sendCourseAssignedNotification(Course course, Tutor tutor) {
        try {
            String tutorEmail = tutor.getUser().getEmail();
            String tutorName = tutor.getFirstName() + " " + tutor.getLastName();
            CreateNotificationRequest notif = new CreateNotificationRequest();
            notif.setUserId(tutor.getUser().getId());
            notif.setRecipientEmail(tutorEmail);
            notif.setSubject("มอบหมายคอร์สใหม่: " + course.getCourseName());
            notif.setMessage(
                "เรียน " + tutorName + "\n\n" +
                "แอดมินได้มอบหมายคอร์สใหม่ให้คุณ:\n" +
                "รหัสคอร์ส: " + course.getCourseCode() + "\n" +
                "ชื่อคอร์ส: " + course.getCourseName() + "\n" +
                "วันที่เริ่มสอน: " + course.getCourseStartDate() + "\n" +
                "จำนวนที่นั่ง: " + course.getSeatLimit() + " คน\n\n" +
                "กรุณาเข้าสู่ระบบเพื่อจัดเตรียมเนื้อหาบทเรียนและข้อสอบ แอดมินจะเปิดรับสมัครให้เมื่อพร้อม"
            );
            notif.setNotificationType(NotificationType.COURSE_ASSIGNED);
            notif.setReferenceType(ReferenceType.COURSE);
            notif.setReferenceId(course.getId());
            notificationService.sendNotification(notif);
        } catch (Exception e) {
            log.warn("Failed to send course-assigned notification for course {}: {}", course.getId(), e.getMessage());
        }
    }

    @Override
    @Transactional
    public CourseResponse updateCourse(Long id, UpdateCourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", id));

        Tutor Tutor = TutorRepository.findById(request.getTutorId())
                .orElseThrow(() -> new ResourceNotFoundException("Tutor", request.getTutorId()));

        validateCourseDates(request.getRegistrationStartDate(),
                request.getRegistrationEndDate(),
                request.getCourseStartDate());

        validateNoScheduleConflict(Tutor.getId(), request.getScheduleDays(), id);
        validateStartDateMatchesSchedule(request.getCourseStartDate(), request.getScheduleDays());

        course.setCourseName(request.getCourseName());
        course.setPrice(request.getPrice());
        course.setDescription(request.getDescription());
        course.setTotalHours(request.getTotalHours());
        course.setSeatLimit(request.getSeatLimit());
        course.setRegistrationStartDate(request.getRegistrationStartDate());
        course.setRegistrationEndDate(request.getRegistrationEndDate());
        course.setCourseStartDate(request.getCourseStartDate());
        course.setTutor(Tutor);

        course.getLessons().clear();
        addLessonsToCoure(course, request.getLessons());

        course.getTests().clear();
        addTestsToCourse(course, request.getTests());

        course.getScheduleDayPatterns().clear();
        addScheduleDayPatterns(course, request.getScheduleDays());

        // ไม่มีปุ่มเปลี่ยนสถานะเองแล้ว — แก้ไขวันที่/บทเรียนแล้วต้องเช็คสถานะให้ตรงทันที
        // แทนที่จะรอ scheduler รอบถัดไป (สูงสุด 60 วินาที)
        LocalDate today = LocalDate.now();
        if (course.getStatus() == CourseStatus.PENDING
                || course.getStatus() == CourseStatus.OPEN_FOR_REGISTRATION
                || course.getStatus() == CourseStatus.CLOSED) {
            course.setStatus(resolveAutoStatus(today, course.getRegistrationStartDate(),
                    course.getRegistrationEndDate()));
        }
        if ((course.getStatus() == CourseStatus.OPEN_FOR_REGISTRATION || course.getStatus() == CourseStatus.CLOSED)
                && course.getCourseStartDate() != null
                && !course.getCourseStartDate().isAfter(today)) {
            course.setStatus(CourseStatus.ONGOING);
        }

        course = courseRepository.save(course);
        long enrolledCount = enrollmentRepository.countByCourseIdAndStatusIn(id,
                List.of(EnrollmentStatus.PENDING, EnrollmentStatus.APPROVED));
        return courseMapper.toDetailResponse(course, enrolledCount);
    }

    @Override
    @Transactional
    public CourseResponse updateCourseStatus(Long id, UpdateCourseStatusRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", id));

        if (request.getStatus() == CourseStatus.OPEN_FOR_REGISTRATION) {
            // นักเรียนจะไม่เห็นคอร์สที่ยังไม่ถึงวันเปิดรับสมัคร แม้สถานะจะเป็น OPEN_FOR_REGISTRATION แล้วก็ตาม
            // (ดู visibleCourses ใน StudentEnrollmentsPage.jsx) — ป้องกันแอดมินเปิดสถานะเองแล้วงงว่าทำไมนักเรียนยังไม่เห็นคอร์ส
            LocalDate today = LocalDate.now();
            if (course.getRegistrationEndDate() != null && course.getRegistrationEndDate().isBefore(today)) {
                throw new InvalidCourseDateException(
                        "วันปิดรับสมัคร (" + course.getRegistrationEndDate()
                                + ") ผ่านไปแล้ว กรุณาแก้ไขวันปิดรับสมัครก่อนเปิดรับสมัครคอร์สนี้");
            }
            if (course.getRegistrationStartDate() == null || course.getRegistrationStartDate().isAfter(today)) {
                course.setRegistrationStartDate(today);
            }
        }

        course.setStatus(request.getStatus());
        course = courseRepository.save(course);
        long enrolledCount = enrollmentRepository.countByCourseIdAndStatusIn(id,
                List.of(EnrollmentStatus.PENDING, EnrollmentStatus.APPROVED));
        return courseMapper.toSummaryResponse(course, enrolledCount);
    }

    @Override
    @Transactional
    public CourseResponse addLesson(Long courseId, CourseLessonRequest request, Long tutorUserId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));
        verifyTutorOwnsCourse(course, tutorUserId);
        ensureLessonsEditable(course);

        CourseLesson lesson = CourseLesson.builder()
                .course(course)
                .lessonTitle(request.getLessonTitle())
                .lessonContent(request.getLessonContent())
                .lessonOrder(request.getLessonOrder())
                .build();
        course.getLessons().add(lesson);

        course = courseRepository.save(course);
        return courseMapper.toDetailResponse(course, countActiveEnrollments(courseId));
    }

    @Override
    @Transactional
    public CourseResponse updateLesson(Long courseId, Long lessonId, CourseLessonRequest request, Long tutorUserId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));
        verifyTutorOwnsCourse(course, tutorUserId);
        ensureLessonsEditable(course);

        CourseLesson lesson = course.getLessons().stream()
                .filter(l -> l.getId().equals(lessonId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Lesson", lessonId));

        lesson.setLessonTitle(request.getLessonTitle());
        lesson.setLessonContent(request.getLessonContent());
        lesson.setLessonOrder(request.getLessonOrder());

        course = courseRepository.save(course);
        return courseMapper.toDetailResponse(course, countActiveEnrollments(courseId));
    }

    @Override
    @Transactional
    public void deleteLesson(Long courseId, Long lessonId, Long tutorUserId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));
        verifyTutorOwnsCourse(course, tutorUserId);
        ensureLessonsEditable(course);

        boolean removed = course.getLessons().removeIf(l -> l.getId().equals(lessonId));
        if (!removed) {
            throw new ResourceNotFoundException("Lesson", lessonId);
        }

        courseRepository.save(course);
    }

    @Override
    @Transactional
    public CourseResponse addTest(Long courseId, CourseTestRequest request, Long tutorUserId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));
        verifyTutorOwnsCourse(course, tutorUserId);
        ensureTestsAddable(course);

        if (request.getLessonOrder() != null
                && course.getLessons().stream().noneMatch(l -> l.getLessonOrder().equals(request.getLessonOrder()))) {
            throw new ResourceNotFoundException("Lesson with order " + request.getLessonOrder() + " not found in this course");
        }

        CourseTest test = CourseTest.builder()
                .course(course)
                .testTitle(request.getTestTitle())
                .testDescription(request.getTestDescription())
                .testOrder(request.getTestOrder())
                .lessonOrder(request.getLessonOrder())
                .build();
        course.getTests().add(test);

        course = courseRepository.save(course);
        return courseMapper.toDetailResponse(course, countActiveEnrollments(courseId));
    }

    @Override
    @Transactional
    public void markCourseViewed(Long courseId, Long tutorUserId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));
        verifyTutorOwnsCourse(course, tutorUserId);

        if (!course.isTutorViewed()) {
            course.setTutorViewed(true);
            courseRepository.save(course);
        }
    }

    private Tutor verifyTutorOwnsCourse(Course course, Long tutorUserId) {
        Tutor tutor = TutorRepository.findByUserId(tutorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Tutor profile not found"));
        if (!course.getTutor().getId().equals(tutor.getId())) {
            throw new IllegalStateException("You are not assigned to this course");
        }
        return tutor;
    }

    // บทเรียนแก้ไข/เพิ่ม/ลบได้เฉพาะช่วง PENDING/CLOSED/OPEN_FOR_REGISTRATION — ล็อกทันทีที่เริ่มสอน (ONGOING)
    private void ensureLessonsEditable(Course course) {
        if (course.getStatus() != CourseStatus.PENDING
                && course.getStatus() != CourseStatus.CLOSED
                && course.getStatus() != CourseStatus.OPEN_FOR_REGISTRATION) {
            throw new IllegalStateException(
                    "Lessons can only be added, edited, or deleted while the course is pending, closed, or open for registration (not once teaching has started)");
        }
    }

    // หัวข้อสอบเพิ่มได้ต่อเนื่องแม้เริ่มสอนแล้ว (ONGOING) เพื่อให้เปิดสอบทีละบทได้
    private void ensureTestsAddable(Course course) {
        if (course.getStatus() != CourseStatus.PENDING
                && course.getStatus() != CourseStatus.CLOSED
                && course.getStatus() != CourseStatus.OPEN_FOR_REGISTRATION
                && course.getStatus() != CourseStatus.ONGOING) {
            throw new IllegalStateException(
                    "Exam topics can only be added while the course is pending, closed, open for registration, or ongoing");
        }
    }

    /**
     * คำนวณสถานะคอร์สจากวันที่รับสมัคร — ใช้ทั้งตอนสร้างคอร์สและตอน scheduler ไล่ auto-transition
     * เพื่อให้ผลลัพธ์ตรงกันเสมอไม่ว่าจะคำนวณตอนไหน
     * ไม่บังคับว่าต้องมีบทเรียนก่อนถึงจะเปิดรับสมัครได้ — ติวเตอร์เพิ่มบทเรียน/ข้อสอบเพิ่มเติมได้ภายหลังระหว่างเปิดรับสมัครอยู่
     */
    private CourseStatus resolveAutoStatus(LocalDate today, LocalDate regStart, LocalDate regEnd) {
        if (regStart == null) {
            return CourseStatus.CLOSED; // ไม่ได้กำหนดวันเปิดรับสมัครไว้ ไม่มีวันให้ระบบอ้างอิง ต้องให้แอดมินเปิดเอง
        }
        if (today.isBefore(regStart)) {
            return CourseStatus.PENDING; // ยังไม่ถึงวันเปิดรับสมัคร
        }
        if (regEnd != null && today.isAfter(regEnd)) {
            return CourseStatus.CLOSED; // ถึงวันเปิดแล้วแต่เลยวันปิดไปด้วย (เช่นตั้งวันย้อนหลัง)
        }
        return CourseStatus.OPEN_FOR_REGISTRATION;
    }

    @Override
    @Transactional
    public void autoTransitionCourses() {
        LocalDate today = LocalDate.now();

        // PENDING ที่ถึงวันเปิดรับสมัครแล้ว → เปิด/ปิด/ค้างไว้ ตามกติกาเดียวกับตอนสร้างคอร์ส
        List<Course> pendingDue = courseRepository.findByStatusAndRegistrationStartDateLessThanEqual(
                CourseStatus.PENDING, today);
        for (Course course : pendingDue) {
            CourseStatus next = resolveAutoStatus(today, course.getRegistrationStartDate(),
                    course.getRegistrationEndDate());
            if (next != course.getStatus()) {
                course.setStatus(next);
                courseRepository.save(course);
                log.info("Auto-transitioned course {} ({}) to {}", course.getId(), course.getCourseName(), next);
            }
        }

        // OPEN_FOR_REGISTRATION ที่พ้นวันปิดรับสมัครแล้ว → ปิดรับสมัครให้อัตโนมัติ
        List<Course> openDue = courseRepository.findByStatusAndRegistrationEndDateLessThan(
                CourseStatus.OPEN_FOR_REGISTRATION, today);
        if (!openDue.isEmpty()) {
            openDue.forEach(course -> course.setStatus(CourseStatus.CLOSED));
            courseRepository.saveAll(openDue);
            log.info("Auto-closed {} course(s) past their registration end date", openDue.size());
        }
    }

    private long countActiveEnrollments(Long courseId) {
        return enrollmentRepository.countByCourseIdAndStatusIn(courseId,
                List.of(EnrollmentStatus.PENDING, EnrollmentStatus.APPROVED));
    }

    @Override
    @Transactional
    public void deleteCourse(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new ResourceNotFoundException("Course", id);
        }

        // ใบสมัครที่ถูกปฏิเสธ/ยกเลิกแล้วไม่ถือว่ายังมีความสัมพันธ์กับคอร์ส (ที่นั่งถูกคืนแล้ว) จึงไม่กันการลบ —
        // กันเฉพาะใบสมัครที่ยัง PENDING/APPROVED/COMPLETED อยู่เท่านั้น
        boolean hasRelatedData = enrollmentRepository.existsByCourseIdAndStatusNotIn(
                        id, List.of(EnrollmentStatus.REJECTED, EnrollmentStatus.CANCELLED))
                || examRepository.existsByCourseId(id)
                || courseScheduleRepository.existsByCourseId(id)
                || classroomSessionRepository.existsByCourseId(id)
                || attendanceRecordRepository.existsByCourseId(id)
                || courseEvaluationRepository.existsByCourseId(id);
        if (hasRelatedData) {
            throw new ResourceInUseException(
                    "ไม่สามารถลบคอร์สเรียนได้เนื่องจากมีข้อมูลเชื่อมโยงอยู่ (การสมัครเรียน/ตารางเรียน/ข้อสอบ/การเข้าเรียน)");
        }

        // ลบใบสมัครที่ถูกปฏิเสธ/ยกเลิกที่ยังผูกกับคอร์สนี้ทิ้งไปด้วย — เพื่อไม่ให้เหลือแถวกำพร้าอ้างอิงคอร์สที่ถูกลบ
        // แล้ว และเพื่อให้ประวัติการสมัครของนักเรียนสำหรับคอร์สนี้หายไปตามคอร์สที่ถูกลบ
        enrollmentRepository.deleteByCourseId(id);

        // ลบ course (cascade → lessons, tests ผ่าน orphanRemoval)
        courseRepository.deleteById(id);
    }

    private void addLessonsToCoure(Course course, List<CourseLessonRequest> lessonRequests) {
        if (lessonRequests == null) return;
        for (CourseLessonRequest req : lessonRequests) {
            CourseLesson lesson = CourseLesson.builder()
                    .course(course)
                    .lessonTitle(req.getLessonTitle())
                    .lessonContent(req.getLessonContent())
                    .lessonOrder(req.getLessonOrder())
                    .build();
            course.getLessons().add(lesson);

            // เพิ่มแบบทดสอบที่ผูกกับบทนี้
            if (req.getTests() != null) {
                int testOrder = 1;
                for (CourseTestRequest t : req.getTests()) {
                    if (t.getTestTitle() == null || t.getTestTitle().isBlank()) continue;
                    CourseTest test = CourseTest.builder()
                            .course(course)
                            .testTitle(t.getTestTitle())
                            .testDescription(t.getTestDescription())
                            .testOrder(testOrder++)
                            .lessonOrder(req.getLessonOrder())
                            .build();
                    course.getTests().add(test);
                }
            }
        }
    }

    private void addTestsToCourse(Course course, List<CourseTestRequest> testRequests) {
        if (testRequests == null) return;
        for (CourseTestRequest req : testRequests) {
            CourseTest test = CourseTest.builder()
                    .course(course)
                    .testTitle(req.getTestTitle())
                    .testDescription(req.getTestDescription())
                    .testOrder(req.getTestOrder())
                    .build();
            course.getTests().add(test);
        }
    }

    private void validateCourseDates(LocalDate regStart, LocalDate regEnd, LocalDate courseStart) {
        if (regStart != null && regEnd != null && regStart.isAfter(regEnd)) {
            throw new InvalidCourseDateException(
                    "Registration start date must not be after registration end date");
        }
        if (regEnd != null && courseStart != null && regEnd.isAfter(courseStart)) {
            throw new InvalidCourseDateException(
                    "Registration end date must not be after course start date");
        }
    }

    /**
     * วันที่เริ่มสอนต้องตรงกับวันในสัปดาห์ของ scheduleDays อย่างน้อยหนึ่งวัน (เช่น ตารางสอน จ/พ/ศ
     * ก็เริ่มได้ทั้งวันจันทร์ พุธ หรือศุกร์) — กันไม่ให้ข้อมูลไม่ตรงกันหลุดผ่าน API ตรงๆ
     * โดยไม่ผ่านหน้าเว็บ (ฝั่ง frontend เช็คแบบเดียวกันใน courseScheduleUtils.js)
     */
    private void validateStartDateMatchesSchedule(LocalDate courseStart, List<ScheduleDaySlotRequest> scheduleDays) {
        if (courseStart == null || scheduleDays == null || scheduleDays.isEmpty()) {
            return;
        }
        String startDayCode = ScheduleDaysParser.toDayCode(courseStart.getDayOfWeek());
        boolean matches = scheduleDays.stream()
                .anyMatch(slot -> slot.getDayOfWeek() != null && startDayCode.equalsIgnoreCase(slot.getDayOfWeek()));
        if (!matches) {
            throw new InvalidCourseDateException(
                    "Course start date must fall on one of the selected schedule days");
        }
    }
}
