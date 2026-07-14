package com.tutorschool.backend.service.impl;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
import com.tutorschool.backend.dto.request.TutorCourseResponseRequest;
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
import com.tutorschool.backend.exception.DuplicateResourceException;
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
        if (courseRepository.existsByCourseCode(request.getCourseCode())) {
            throw new DuplicateResourceException("Course code already exists: " + request.getCourseCode());
        }

        Tutor tutor = TutorRepository.findById(request.getTutorId())
                .orElseThrow(() -> new ResourceNotFoundException("Tutor", request.getTutorId()));

        validateCourseDates(request.getRegistrationStartDate(),
                request.getRegistrationEndDate(),
                request.getCourseStartDate());

        BigDecimal price = (request.getPrice() != null) ? request.getPrice() : BigDecimal.ZERO;

        // ระบบจัดวัน-เวลาสอนให้ติวเตอร์เองอัตโนมัติ ไม่ให้แอดมินเลือกเอง — ต้องไม่ชนกับคอร์สอื่นของติวเตอร์คนเดียวกัน
        String scheduleDays = autoAssignScheduleDays(tutor.getId(), request.getTotalHours(), null);

        Course course = Course.builder()
                .courseCode(request.getCourseCode())
                .courseName(request.getCourseName())
                .price(price)
                .description(request.getDescription())
                .totalHours(request.getTotalHours())
                .seatLimit(request.getSeatLimit())
                .registrationStartDate(request.getRegistrationStartDate())
                .registrationEndDate(request.getRegistrationEndDate())
                .courseStartDate(request.getCourseStartDate())
                .status(CourseStatus.DRAFT)
                .tutor(tutor)
                .scheduleDays(scheduleDays)
                .scheduleStartTime(null)
                .scheduleEndTime(null)
                .build();

        addLessonsToCoure(course, request.getLessons());
        addTestsToCourse(course, request.getTests());

        course = courseRepository.save(course);

        sendCourseAssignedNotification(course, tutor);

        return courseMapper.toDetailResponse(course, 0L);
    }

    private static final LocalTime WORK_START = LocalTime.of(9, 0);
    private static final LocalTime WORK_END = LocalTime.of(20, 0);
    private static final Duration SESSION_LENGTH = Duration.ofHours(2);
    private static final String[] WEEK_DAYS = {"MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"};

    private int computeDaysPerWeek(int totalHours) {
        if (totalHours <= 6) return 1;
        if (totalHours <= 20) return 2;
        if (totalHours <= 40) return 3;
        return 4;
    }

    /**
     * Auto-picks weekly teaching day/time slots for a tutor (2h sessions, 09:00-20:00),
     * avoiding any overlap with that tutor's OTHER existing courses. Number of days/week is
     * derived from totalHours (see computeDaysPerWeek). excludeCourseId lets a future
     * update-course flow exclude the course being edited from its own conflict check.
     */
    private String autoAssignScheduleDays(Long tutorId, int totalHours, Long excludeCourseId) {
        int daysNeeded = computeDaysPerWeek(totalHours);

        Map<String, List<LocalTime[]>> busyByDay = new HashMap<>();
        for (Course other : courseRepository.findByTutorId(tutorId)) {
            if (excludeCourseId != null && excludeCourseId.equals(other.getId())) {
                continue;
            }
            ScheduleDaysParser.parseSlots(other.getScheduleDays())
                    .forEach((day, slot) -> busyByDay.computeIfAbsent(day, k -> new ArrayList<>()).add(slot));
        }

        Map<String, LocalTime[]> assigned = new LinkedHashMap<>();

        for (String day : WEEK_DAYS) {
            if (assigned.size() >= daysNeeded) {
                break;
            }

            List<LocalTime[]> busy = busyByDay.getOrDefault(day, List.of()).stream()
                    .sorted(Comparator.comparing(iv -> iv[0]))
                    .toList();

            LocalTime[] freeSlot = findFreeSlot(busy, WORK_START, WORK_END, SESSION_LENGTH);
            if (freeSlot != null) {
                assigned.put(day, freeSlot);
            }
        }

        if (assigned.size() < daysNeeded) {
            throw new CourseScheduleConflictException(
                    "ไม่สามารถจัดตารางสอนให้ติวเตอร์คนนี้ได้ครบตามจำนวนที่ต้องการ (ต้องการ "
                            + daysNeeded + " วัน/สัปดาห์ แต่หาวัน-เวลาว่างได้เพียง " + assigned.size()
                            + " วัน) กรุณาลดจำนวนชั่วโมงรวมของคอร์ส หรือมอบหมายติวเตอร์คนอื่น");
        }

        return java.util.Arrays.stream(WEEK_DAYS)
                .filter(assigned::containsKey)
                .map(day -> day + ":" + assigned.get(day)[0] + "-" + assigned.get(day)[1])
                .collect(Collectors.joining(","));
    }

    private LocalTime[] findFreeSlot(List<LocalTime[]> busyIntervals, LocalTime workStart, LocalTime workEnd,
                                      Duration sessionLength) {
        LocalTime cursor = workStart;

        for (LocalTime[] busy : busyIntervals) {
            LocalTime slotEnd = cursor.plus(sessionLength);
            if (!slotEnd.isAfter(busy[0])) {
                return new LocalTime[]{cursor, slotEnd};
            }
            if (busy[1].isAfter(cursor)) {
                cursor = busy[1];
            }
        }

        LocalTime slotEnd = cursor.plus(sessionLength);
        if (!slotEnd.isAfter(workEnd)) {
            return new LocalTime[]{cursor, slotEnd};
        }

        return null;
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
                "กรุณาเข้าสู่ระบบเพื่อตอบรับหรือปฏิเสธคอร์สนี้"
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

        if (!course.getCourseCode().equals(request.getCourseCode())
                && courseRepository.existsByCourseCodeAndIdNot(request.getCourseCode(), id)) {
            throw new DuplicateResourceException("Course code already exists: " + request.getCourseCode());
        }

        Tutor Tutor = TutorRepository.findById(request.getTutorId())
                .orElseThrow(() -> new ResourceNotFoundException("Tutor", request.getTutorId()));

        validateCourseDates(request.getRegistrationStartDate(),
                request.getRegistrationEndDate(),
                request.getCourseStartDate());

        course.setCourseCode(request.getCourseCode());
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

        course.setStatus(request.getStatus());
        course = courseRepository.save(course);
        long enrolledCount = enrollmentRepository.countByCourseIdAndStatusIn(id,
                List.of(EnrollmentStatus.PENDING, EnrollmentStatus.APPROVED));
        return courseMapper.toSummaryResponse(course, enrolledCount);
    }

    @Override
    @Transactional
    public CourseResponse tutorRespondToCourse(Long courseId, TutorCourseResponseRequest request, Long tutorUserId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));

        Tutor tutor = TutorRepository.findByUserId(tutorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Tutor profile not found"));

        if (!course.getTutor().getId().equals(tutor.getId())) {
            throw new IllegalStateException("You are not assigned to this course");
        }

        if (request.isAccepted()) {
            course.setStatus(CourseStatus.ACCEPTED);
            if (request.getLessons() != null && !request.getLessons().isEmpty()) {
                course.getLessons().clear();
                addLessonsToCoure(course, request.getLessons());
            }
            if (request.getTests() != null && !request.getTests().isEmpty()) {
                course.getTests().clear();
                addTestsToCourse(course, request.getTests());
            }
        } else {
            course.setStatus(CourseStatus.CANCELLED);
            course.setTutorRemark(request.getRemark());
        }

        course = courseRepository.save(course);
        long enrolledCount = enrollmentRepository.countByCourseIdAndStatusIn(courseId,
                List.of(EnrollmentStatus.PENDING, EnrollmentStatus.APPROVED));
        return courseMapper.toDetailResponse(course, enrolledCount);
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
    public CourseResponse publishCourse(Long courseId, Long tutorUserId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));
        verifyTutorOwnsCourse(course, tutorUserId);

        if (course.getStatus() != CourseStatus.ACCEPTED) {
            throw new IllegalStateException("Course must be accepted (and not already published) before it can be published");
        }
        if (course.getLessons().isEmpty()) {
            throw new IllegalStateException("Course must have at least 1 lesson before it can be published");
        }

        course.setStatus(CourseStatus.OPEN_FOR_REGISTRATION);
        course = courseRepository.save(course);
        return courseMapper.toDetailResponse(course, countActiveEnrollments(courseId));
    }

    private Tutor verifyTutorOwnsCourse(Course course, Long tutorUserId) {
        Tutor tutor = TutorRepository.findByUserId(tutorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Tutor profile not found"));
        if (!course.getTutor().getId().equals(tutor.getId())) {
            throw new IllegalStateException("You are not assigned to this course");
        }
        return tutor;
    }

    // บทเรียนแก้ไข/เพิ่ม/ลบได้เฉพาะช่วง ACCEPTED/OPEN_FOR_REGISTRATION — ล็อกทันทีที่เริ่มสอน (ONGOING)
    private void ensureLessonsEditable(Course course) {
        if (course.getStatus() != CourseStatus.ACCEPTED && course.getStatus() != CourseStatus.OPEN_FOR_REGISTRATION) {
            throw new IllegalStateException(
                    "Lessons can only be added, edited, or deleted while the course is accepted or open for registration (not once teaching has started)");
        }
    }

    // หัวข้อสอบเพิ่มได้ต่อเนื่องแม้เริ่มสอนแล้ว (ONGOING) เพื่อให้เปิดสอบทีละบทได้
    private void ensureTestsAddable(Course course) {
        if (course.getStatus() != CourseStatus.ACCEPTED
                && course.getStatus() != CourseStatus.OPEN_FOR_REGISTRATION
                && course.getStatus() != CourseStatus.ONGOING) {
            throw new IllegalStateException(
                    "Exam topics can only be added while the course is accepted, open for registration, or ongoing");
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
