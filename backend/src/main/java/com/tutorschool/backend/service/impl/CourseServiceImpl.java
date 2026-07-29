package com.tutorschool.backend.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

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
import com.tutorschool.backend.dto.request.UpdateCourseRequest;
import com.tutorschool.backend.dto.request.UpdateCourseStatusRequest;
import com.tutorschool.backend.dto.response.CourseResponse;
import com.tutorschool.backend.dto.response.PageResponse;
import com.tutorschool.backend.entity.Course;
import com.tutorschool.backend.entity.CourseLesson;
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
import com.tutorschool.backend.repository.CourseScheduleRepository;
import com.tutorschool.backend.repository.EnrollmentRepository;
import com.tutorschool.backend.repository.ExamRepository;
import com.tutorschool.backend.repository.TutorRepository;
import com.tutorschool.backend.service.CourseService;
import com.tutorschool.backend.service.NotificationService;
import com.tutorschool.backend.util.ScheduleDaysParser;

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
        String scheduleDays = request.getScheduleDays();
        validateNoScheduleConflict(tutor.getId(), scheduleDays, null);

        boolean hasLessons = request.getLessons() != null && !request.getLessons().isEmpty();
        CourseStatus initialStatus = resolveAutoStatus(LocalDate.now(),
                request.getRegistrationStartDate(), request.getRegistrationEndDate(), hasLessons);

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
                .scheduleDays(scheduleDays)
                .scheduleStartTime(null)
                .scheduleEndTime(null)
                .build();

        addLessonsToCoure(course, request.getLessons());
        addTestsToCourse(course, request.getTests());

        course = courseRepository.save(course);

        // รหัสคอร์สอิงจาก id ในฐานข้อมูล เรียงลำดับตามลำดับสร้าง แก้ไขไม่ได้ (เหมือน ENR-/EXM-)
        course.setCourseCode("CRS-" + String.format("%04d", course.getId()));
        course = courseRepository.save(course);

        sendCourseAssignedNotification(course, tutor);

        return courseMapper.toDetailResponse(course, 0L);
    }

    /**
     * Validates that the admin-chosen scheduleDays ("MON:10:00-12:00,WED:..." format) does not
     * overlap, on any shared day, with the SAME tutor's other existing courses. excludeCourseId
     * lets the update-course flow exclude the course being edited from its own conflict check.
     */
    private void validateNoScheduleConflict(Long tutorId, String scheduleDays, Long excludeCourseId) {
        Map<String, LocalTime[]> newSlots = ScheduleDaysParser.parseSlots(scheduleDays);

        for (Course other : courseRepository.findByTutorId(tutorId)) {
            if (excludeCourseId != null && excludeCourseId.equals(other.getId())) {
                continue;
            }

            Map<String, LocalTime[]> otherSlots = ScheduleDaysParser.parseSlots(other.getScheduleDays());
            for (Map.Entry<String, LocalTime[]> entry : newSlots.entrySet()) {
                LocalTime[] otherSlot = otherSlots.get(entry.getKey());
                if (otherSlot == null) {
                    continue;
                }

                LocalTime[] slot = entry.getValue();
                boolean overlap = slot[0].isBefore(otherSlot[1]) && otherSlot[0].isBefore(slot[1]);
                if (overlap) {
                    throw new CourseScheduleConflictException(
                            "วัน-เวลาที่เลือกชนกับคอร์ส \"" + other.getCourseName() + "\" ของติวเตอร์คนนี้ ("
                                    + entry.getKey() + " " + otherSlot[0] + "-" + otherSlot[1] + ")");
                }
            }
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

        course.setCourseName(request.getCourseName());
        course.setPrice(request.getPrice());
        course.setDescription(request.getDescription());
        course.setTotalHours(request.getTotalHours());
        course.setSeatLimit(request.getSeatLimit());
        course.setRegistrationStartDate(request.getRegistrationStartDate());
        course.setRegistrationEndDate(request.getRegistrationEndDate());
        course.setCourseStartDate(request.getCourseStartDate());
        course.setTutor(Tutor);
        course.setScheduleDays(request.getScheduleDays());
        course.setScheduleStartTime(request.getScheduleStartTime());
        course.setScheduleEndTime(request.getScheduleEndTime());

        course.getLessons().clear();
        addLessonsToCoure(course, request.getLessons());

        course.getTests().clear();
        addTestsToCourse(course, request.getTests());

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

        if (request.getStatus() == CourseStatus.OPEN_FOR_REGISTRATION && course.getLessons().isEmpty()) {
            throw new IllegalStateException("Course must have at least 1 lesson before it can be opened for registration");
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
     */
    private CourseStatus resolveAutoStatus(LocalDate today, LocalDate regStart, LocalDate regEnd, boolean hasLessons) {
        if (regStart == null) {
            return CourseStatus.CLOSED; // ไม่ได้กำหนดวันเปิดรับสมัครไว้ ไม่มีวันให้ระบบอ้างอิง ต้องให้แอดมินเปิดเอง
        }
        if (today.isBefore(regStart)) {
            return CourseStatus.PENDING; // ยังไม่ถึงวันเปิดรับสมัคร
        }
        if (regEnd != null && today.isAfter(regEnd)) {
            return CourseStatus.CLOSED; // ถึงวันเปิดแล้วแต่เลยวันปิดไปด้วย (เช่นตั้งวันย้อนหลัง)
        }
        // ถึงวันเปิดรับสมัครแล้วและยังอยู่ในช่วง — เปิดได้ก็ต่อเมื่อมีบทเรียนอย่างน้อย 1 บท
        // ถ้ายังไม่มีบทเรียน ให้ค้างสถานะรอเปิดรับสมัครไว้ก่อน จนกว่าติวเตอร์จะเพิ่มบทเรียน
        return hasLessons ? CourseStatus.OPEN_FOR_REGISTRATION : CourseStatus.PENDING;
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
                    course.getRegistrationEndDate(), !course.getLessons().isEmpty());
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

        boolean hasRelatedData = enrollmentRepository.existsByCourseId(id)
                || examRepository.existsByCourseId(id)
                || courseScheduleRepository.existsByCourseId(id)
                || classroomSessionRepository.existsByCourseId(id)
                || attendanceRecordRepository.existsByCourseId(id)
                || courseEvaluationRepository.existsByCourseId(id);
        if (hasRelatedData) {
            throw new ResourceInUseException(
                    "ไม่สามารถลบคอร์สเรียนได้เนื่องจากมีข้อมูลเชื่อมโยงอยู่ (การสมัครเรียน/ตารางเรียน/ข้อสอบ/การเข้าเรียน)");
        }

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
}
