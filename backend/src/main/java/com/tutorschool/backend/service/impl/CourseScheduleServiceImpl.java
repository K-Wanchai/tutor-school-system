package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.CancelCourseScheduleRequest;
import com.tutorschool.backend.dto.request.CreateCourseScheduleRequest;
import com.tutorschool.backend.dto.request.CreateNotificationRequest;
import com.tutorschool.backend.dto.request.GenerateCourseScheduleRequest;
import com.tutorschool.backend.dto.request.UpdateCourseScheduleRequest;
import com.tutorschool.backend.dto.response.CourseScheduleResponse;
import com.tutorschool.backend.entity.*;
import com.tutorschool.backend.exception.*;
import com.tutorschool.backend.mapper.CourseScheduleMapper;
import com.tutorschool.backend.repository.*;
import com.tutorschool.backend.service.CourseScheduleService;
import com.tutorschool.backend.service.NotificationService;
import com.tutorschool.backend.util.ScheduleDaysParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tutorschool.backend.dto.response.TutorAvailabilityResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourseScheduleServiceImpl implements CourseScheduleService {

    private final CourseScheduleRepository courseScheduleRepository;
    private final CourseRepository courseRepository;
    private final CourseLessonRepository courseLessonRepository;
    private final TutorRepository TutorRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final CourseScheduleMapper courseScheduleMapper;

    @Override
    @Transactional
    public CourseScheduleResponse createSchedule(CreateCourseScheduleRequest request, Long currentUserId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + request.getCourseId()));

        Tutor Tutor = TutorRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Tutor profile not found"));

        // Tutor ต้องเป็นเจ้าของ course เท่านั้น
        if (currentUser.getRole() == Role.TUTOR && !course.getTutor().getId().equals(Tutor.getId())) {
            throw new UnauthorizedScheduleAccessException("You can only create schedules for your own courses");
        }

        // ตรวจ lesson ต้องอยู่ใน course เดียวกัน
        CourseLesson lesson = null;
        if (request.getLessonId() != null) {
            lesson = courseLessonRepository.findById(request.getLessonId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lesson not found with id: " + request.getLessonId()));
            if (!lesson.getCourse().getId().equals(course.getId())) {
                throw new InvalidScheduleTimeException("Lesson does not belong to the specified course");
            }
        }

        // startTime ต้องก่อน endTime
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new InvalidScheduleTimeException("startTime must be before endTime");
        }

        // ตรวจ location / meetingLink ตาม scheduleType
        validateLocationAndLink(request.getScheduleType(), request.getLocation(), request.getMeetingLink());

        CourseSchedule schedule = CourseSchedule.builder()
                .course(course)
                .lesson(lesson)
                .tutor(Tutor)
                .title(request.getTitle())
                .description(request.getDescription())
                .scheduleDate(request.getScheduleDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .location(request.getLocation())
                .meetingLink(request.getMeetingLink())
                .scheduleType(request.getScheduleType())
                .status(ScheduleStatus.SCHEDULED)
                .build();

        schedule = courseScheduleRepository.save(schedule);
        schedule.setScheduleCode("SCH-" + String.format("%08d", schedule.getId()));
        schedule = courseScheduleRepository.save(schedule);

        // ส่ง Email แจ้งเตือนนักเรียนที่ enroll คอร์สนี้
        sendScheduleCreatedNotifications(schedule, course);

        return courseScheduleMapper.toResponse(schedule);
    }

    /**
     * Generates one CourseSchedule per CourseLesson (in lessonOrder), walking forward day-by-day
     * from course.courseStartDate and matching against the recurring weekly pattern in
     * course.scheduleDays (e.g. "MON:10:00-15:00,WED:15:00-19:00"). Stops once every lesson has
     * a session. Refuses to run if the course already has schedules, since there's no
     * partial-regeneration semantics — cancel/delete existing ones first.
     */
    @Override
    @Transactional
    public List<CourseScheduleResponse> generateSchedulesFromCoursePattern(
            Long courseId, GenerateCourseScheduleRequest request, Long currentUserId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        Tutor Tutor = TutorRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Tutor profile not found"));

        if (currentUser.getRole() == Role.TUTOR && !course.getTutor().getId().equals(Tutor.getId())) {
            throw new UnauthorizedScheduleAccessException("You can only generate schedules for your own courses");
        }

        validateLocationAndLink(request.getScheduleType(), request.getLocation(), request.getMeetingLink());

        Map<String, LocalTime[]> daySlots = ScheduleDaysParser.parseSlots(course.getScheduleDays());
        if (daySlots.isEmpty()) {
            throw new InvalidScheduleTimeException(
                    "Course has no weekly schedule pattern (scheduleDays) to generate from");
        }

        List<CourseLesson> lessons = courseLessonRepository.findByCourseIdOrderByLessonOrderAsc(courseId);
        if (lessons.isEmpty()) {
            throw new InvalidScheduleTimeException("Course has no lessons to generate schedules for");
        }

        if (!courseScheduleRepository.findByCourseIdOrderByScheduleDateAscStartTimeAsc(courseId).isEmpty()) {
            throw new InvalidScheduleTimeException(
                    "Course schedules already exist for this course — cancel or delete them before regenerating");
        }

        List<CourseSchedule> created = new ArrayList<>();
        LocalDate cursor = course.getCourseStartDate();
        int lessonIndex = 0;
        int scanned = 0;
        int safetyLimitDays = 3650; // 10 years — guards against an unmatched pattern looping forever

        while (lessonIndex < lessons.size() && scanned < safetyLimitDays) {
            LocalTime[] slot = daySlots.get(ScheduleDaysParser.toDayCode(cursor.getDayOfWeek()));

            if (slot != null) {
                CourseLesson lesson = lessons.get(lessonIndex);

                CourseSchedule schedule = CourseSchedule.builder()
                        .course(course)
                        .lesson(lesson)
                        .tutor(course.getTutor())
                        .title(lesson.getLessonTitle())
                        .description(lesson.getLessonContent())
                        .scheduleDate(cursor)
                        .startTime(slot[0])
                        .endTime(slot[1])
                        .location(request.getLocation())
                        .meetingLink(request.getMeetingLink())
                        .scheduleType(request.getScheduleType())
                        .status(ScheduleStatus.SCHEDULED)
                        .build();

                schedule = courseScheduleRepository.save(schedule);
                schedule.setScheduleCode("SCH-" + String.format("%08d", schedule.getId()));
                schedule = courseScheduleRepository.save(schedule);

                created.add(schedule);
                lessonIndex++;
            }

            cursor = cursor.plusDays(1);
            scanned++;
        }

        return created.stream().map(courseScheduleMapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseScheduleResponse> getAllSchedules() {
        return courseScheduleRepository.findAll()
                .stream()
                .map(courseScheduleMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CourseScheduleResponse getScheduleById(Long id) {
        CourseSchedule schedule = courseScheduleRepository.findById(id)
                .orElseThrow(() -> new CourseScheduleNotFoundException("Course schedule not found with id: " + id));
        return courseScheduleMapper.toResponse(schedule);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseScheduleResponse> getSchedulesByCourseId(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course not found with id: " + courseId);
        }
        return courseScheduleRepository.findByCourseIdOrderByScheduleDateAscStartTimeAsc(courseId)
                .stream()
                .map(courseScheduleMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseScheduleResponse> getMySchedulesAsStudent(Long studentUserId) {
        Student student = studentRepository.findByUserId(studentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found"));

        List<CourseSchedule> realSchedules = courseScheduleRepository.findByStudentEnrollment(student.getId());

        Map<Long, Set<LocalDate>> coveredDatesByCourse = new HashMap<>();
        for (CourseSchedule cs : realSchedules) {
            coveredDatesByCourse
                    .computeIfAbsent(cs.getCourse().getId(), k -> new HashSet<>())
                    .add(cs.getScheduleDate());
        }

        List<CourseScheduleResponse> responses = new ArrayList<>(
                realSchedules.stream().map(courseScheduleMapper::toResponse).toList());

        List<Enrollment> enrolledCourses = enrollmentRepository.findByStudentId(student.getId()).stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.APPROVED || e.getStatus() == EnrollmentStatus.COMPLETED)
                .toList();

        for (Enrollment enrollment : enrolledCourses) {
            Course course = enrollment.getCourse();
            Set<LocalDate> covered = coveredDatesByCourse.getOrDefault(course.getId(), Set.of());
            responses.addAll(buildVirtualSchedulesFromCoursePattern(course, covered));
        }

        responses.sort(Comparator.comparing(CourseScheduleResponse::getScheduleDate)
                .thenComparing(CourseScheduleResponse::getStartTime));

        return responses;
    }

    /**
     * Derives calendar-real class occurrences directly from Course.scheduleDays +
     * courseStartDate for a student's timetable, without requiring an admin to have manually
     * created CourseSchedule rows first. Recurs weekly until the sum of session durations
     * reaches course.totalHours. Dates that already have a real CourseSchedule row are skipped
     * here so an admin-created/cancelled entry always takes precedence.
     */
    private List<CourseScheduleResponse> buildVirtualSchedulesFromCoursePattern(
            Course course, Set<LocalDate> excludeDates) {
        Map<String, LocalTime[]> daySlots = ScheduleDaysParser.parseSlots(course.getScheduleDays());
        if (daySlots.isEmpty() || course.getCourseStartDate() == null || course.getTotalHours() == null) {
            return List.of();
        }

        List<CourseScheduleResponse> virtualSchedules = new ArrayList<>();
        LocalDate cursor = course.getCourseStartDate();
        long targetMinutes = course.getTotalHours() * 60L;
        long cumulativeMinutes = 0;
        int scanned = 0;
        int safetyLimitDays = 3650; // 10 years — guards against an unmatched pattern looping forever

        while (cumulativeMinutes < targetMinutes && scanned < safetyLimitDays) {
            LocalTime[] slot = daySlots.get(ScheduleDaysParser.toDayCode(cursor.getDayOfWeek()));

            if (slot != null) {
                if (!excludeDates.contains(cursor)) {
                    virtualSchedules.add(CourseScheduleResponse.builder()
                            .courseId(course.getId())
                            .courseName(course.getCourseName())
                            .scheduleCode("VIRTUAL-" + course.getId() + "-" + cursor)
                            .tutorId(course.getTutor().getId())
                            .teacherName(course.getTutor().getFirstName() + " " + course.getTutor().getLastName())
                            .title(course.getCourseName())
                            .scheduleDate(cursor)
                            .startTime(slot[0])
                            .endTime(slot[1])
                            .status(ScheduleStatus.SCHEDULED)
                            .build());
                }
                cumulativeMinutes += Duration.between(slot[0], slot[1]).toMinutes();
            }

            cursor = cursor.plusDays(1);
            scanned++;
        }

        return virtualSchedules;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseScheduleResponse> getMySchedulesAsTeacher(Long teacherUserId) {
        Tutor Tutor = TutorRepository.findByUserId(teacherUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Tutor profile not found"));

        List<CourseSchedule> realSchedules =
                courseScheduleRepository.findByTutorIdOrderByScheduleDateAscStartTimeAsc(Tutor.getId());

        Map<Long, Set<LocalDate>> coveredDatesByCourse = new HashMap<>();
        for (CourseSchedule cs : realSchedules) {
            coveredDatesByCourse
                    .computeIfAbsent(cs.getCourse().getId(), k -> new HashSet<>())
                    .add(cs.getScheduleDate());
        }

        List<CourseScheduleResponse> responses = new ArrayList<>(
                realSchedules.stream().map(courseScheduleMapper::toResponse).toList());

        List<Course> ownCourses = courseRepository.findByTutorId(Tutor.getId()).stream()
                .filter(c -> c.getStatus() != CourseStatus.CANCELLED && c.getStatus() != CourseStatus.DRAFT)
                .toList();

        for (Course course : ownCourses) {
            Set<LocalDate> covered = coveredDatesByCourse.getOrDefault(course.getId(), Set.of());
            responses.addAll(buildVirtualSchedulesFromCoursePattern(course, covered));
        }

        responses.sort(Comparator.comparing(CourseScheduleResponse::getScheduleDate)
                .thenComparing(CourseScheduleResponse::getStartTime));

        return responses;
    }

    @Override
    @Transactional
    public CourseScheduleResponse updateSchedule(Long id, UpdateCourseScheduleRequest request, Long currentUserId) {
        CourseSchedule schedule = courseScheduleRepository.findById(id)
                .orElseThrow(() -> new CourseScheduleNotFoundException("Course schedule not found with id: " + id));

        checkTeacherOwnership(schedule, currentUserId);

        if (schedule.getStatus() == ScheduleStatus.CANCELLED) {
            throw new ScheduleAlreadyCancelledException("Cannot update a cancelled schedule");
        }

        // อัปเดตเฉพาะ field ที่แก้ได้ — scheduleDate, startTime, endTime ห้ามแก้
        schedule.setTitle(request.getTitle());
        schedule.setDescription(request.getDescription());
        schedule.setLocation(request.getLocation());
        schedule.setMeetingLink(request.getMeetingLink());

        validateLocationAndLink(schedule.getScheduleType(), schedule.getLocation(), schedule.getMeetingLink());

        return courseScheduleMapper.toResponse(courseScheduleRepository.save(schedule));
    }

    @Override
    @Transactional
    public CourseScheduleResponse cancelSchedule(Long id, CancelCourseScheduleRequest request, Long currentUserId) {
        CourseSchedule schedule = courseScheduleRepository.findById(id)
                .orElseThrow(() -> new CourseScheduleNotFoundException("Course schedule not found with id: " + id));

        checkTeacherOwnership(schedule, currentUserId);

        if (schedule.getStatus() == ScheduleStatus.CANCELLED) {
            throw new ScheduleAlreadyCancelledException("Schedule is already cancelled");
        }

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        schedule.setStatus(ScheduleStatus.CANCELLED);
        schedule.setCancelReason(request.getCancelReason());
        schedule.setCancelledAt(LocalDateTime.now());
        schedule.setCancelledBy(currentUser.getEmail());

        schedule = courseScheduleRepository.save(schedule);

        // ส่ง Email แจ้งยกเลิกคลาสให้นักเรียนและ Tutor
        sendCancellationNotifications(schedule, request.getCancelReason());

        return courseScheduleMapper.toResponse(schedule);
    }

    @Override
    @Transactional
    public void deleteSchedule(Long id, Long currentUserId) {
        CourseSchedule schedule = courseScheduleRepository.findById(id)
                .orElseThrow(() -> new CourseScheduleNotFoundException("Course schedule not found with id: " + id));

        checkTeacherOwnership(schedule, currentUserId);
        courseScheduleRepository.deleteById(id);
    }

    // ตรวจว่า Tutor เป็นเจ้าของ schedule หรือเป็น Admin
    private void checkTeacherOwnership(CourseSchedule schedule, Long currentUserId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (currentUser.getRole() == Role.ADMIN) {
            return;
        }

        Tutor Tutor = TutorRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new UnauthorizedScheduleAccessException("Tutor profile not found"));

        if (!schedule.getTutor().getId().equals(Tutor.getId())) {
            throw new UnauthorizedScheduleAccessException("You can only manage your own schedules");
        }
    }

    private void validateLocationAndLink(ScheduleType scheduleType, String location, String meetingLink) {
        if (scheduleType == ScheduleType.ONLINE) {
            if (meetingLink == null || meetingLink.isBlank()) {
                throw new InvalidScheduleTimeException("meetingLink is required for ONLINE schedule");
            }
        }
        if (scheduleType == ScheduleType.ONSITE) {
            if (location == null || location.isBlank()) {
                throw new InvalidScheduleTimeException("location is required for ONSITE schedule");
            }
        }
    }

    private void sendScheduleCreatedNotifications(CourseSchedule schedule, Course course) {
        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(course.getId())
                .stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.APPROVED || e.getStatus() == EnrollmentStatus.COMPLETED)
                .toList();

        String subject = "ตารางเรียนใหม่: " + course.getCourseName();
        String scheduleDate = schedule.getScheduleDate().toString();
        String startTime = schedule.getStartTime().toString();
        String endTime = schedule.getEndTime().toString();

        for (Enrollment enrollment : enrollments) {
            try {
                CreateNotificationRequest req = new CreateNotificationRequest();
                req.setUserId(enrollment.getStudent().getUser().getId());
                req.setRecipientEmail(enrollment.getStudent().getUser().getEmail());
                req.setSubject(subject);
                req.setMessage(buildScheduleCreatedMessage(course.getCourseName(), scheduleDate,
                        startTime, endTime, schedule.getLocation(),
                        schedule.getMeetingLink(), schedule.getScheduleType().name()));
                req.setNotificationType(NotificationType.COURSE_SCHEDULE_CREATED);
                req.setReferenceType(ReferenceType.SCHEDULE);
                req.setReferenceId(schedule.getId());
                notificationService.sendNotification(req);
            } catch (Exception e) {
                log.error("Failed to notify student {} for schedule {}: {}",
                        enrollment.getStudent().getId(), schedule.getId(), e.getMessage());
            }
        }
    }

    private void sendCancellationNotifications(CourseSchedule schedule, String cancelReason) {
        Course course = schedule.getCourse();
        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(course.getId())
                .stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.APPROVED || e.getStatus() == EnrollmentStatus.COMPLETED)
                .toList();

        String subject = "แจ้งยกเลิกคลาสเรียน: " + course.getCourseName();
        String scheduleDate = schedule.getScheduleDate().toString();
        String startTime = schedule.getStartTime().toString();
        String endTime = schedule.getEndTime().toString();
        String message = buildCancelMessage(course.getCourseName(), scheduleDate, startTime, endTime, cancelReason);

        // แจ้งนักเรียน
        for (Enrollment enrollment : enrollments) {
            try {
                CreateNotificationRequest req = new CreateNotificationRequest();
                req.setUserId(enrollment.getStudent().getUser().getId());
                req.setRecipientEmail(enrollment.getStudent().getUser().getEmail());
                req.setSubject(subject);
                req.setMessage(message);
                req.setNotificationType(NotificationType.CLASS_CANCELLED);
                req.setReferenceType(ReferenceType.SCHEDULE);
                req.setReferenceId(schedule.getId());
                notificationService.sendNotification(req);
            } catch (Exception e) {
                log.error("Failed to notify student {} for cancellation: {}", enrollment.getStudent().getId(), e.getMessage());
            }
        }

        // แจ้ง Tutor
        try {
            Tutor Tutor = schedule.getTutor();
            CreateNotificationRequest teacherReq = new CreateNotificationRequest();
            teacherReq.setUserId(Tutor.getUser().getId());
            teacherReq.setRecipientEmail(Tutor.getUser().getEmail());
            teacherReq.setSubject(subject);
            teacherReq.setMessage(message);
            teacherReq.setNotificationType(NotificationType.CLASS_CANCELLED);
            teacherReq.setReferenceType(ReferenceType.SCHEDULE);
            teacherReq.setReferenceId(schedule.getId());
            notificationService.sendNotification(teacherReq);
        } catch (Exception e) {
            log.error("Failed to notify Tutor for cancellation: {}", e.getMessage());
        }
    }

    private String buildScheduleCreatedMessage(String courseName, String scheduleDate,
                                                String startTime, String endTime,
                                                String location, String meetingLink,
                                                String scheduleType) {
        StringBuilder sb = new StringBuilder();
        sb.append("เรียนคุณนักเรียน,\n\n");
        sb.append("มีตารางเรียนใหม่สำหรับคอร์ส: ").append(courseName).append("\n\n");
        sb.append("รายละเอียด:\n");
        sb.append("วันที่: ").append(scheduleDate).append("\n");
        sb.append("เวลา: ").append(startTime).append(" - ").append(endTime).append("\n");
        sb.append("รูปแบบ: ").append(scheduleType).append("\n");
        if (location != null && !location.isBlank()) {
            sb.append("สถานที่: ").append(location).append("\n");
        }
        if (meetingLink != null && !meetingLink.isBlank()) {
            sb.append("ลิงก์เรียนออนไลน์: ").append(meetingLink).append("\n");
        }
        sb.append("\nกรุณาตรวจสอบตารางเรียนของคุณในระบบ\n\n");
        sb.append("ขอแสดงความนับถือ\nTutor School System");
        return sb.toString();
    }

    @Override
    @Transactional(readOnly = true)
    public TutorAvailabilityResponse getTutorAvailability(Long tutorId, LocalDate date) {
        Tutor tutor = TutorRepository.findById(tutorId)
                .orElseThrow(() -> new ResourceNotFoundException("Tutor not found with id: " + tutorId));

        List<CourseSchedule> busySchedules = courseScheduleRepository
                .findBusySlotsByTutorAndDate(tutor.getId(), date);

        List<TutorAvailabilityResponse.TimeSlot> busySlots = busySchedules.stream()
                .map(cs -> TutorAvailabilityResponse.TimeSlot.builder()
                        .startTime(cs.getStartTime())
                        .endTime(cs.getEndTime())
                        .courseTitle(cs.getCourse().getCourseName())
                        .scheduleCode(cs.getScheduleCode())
                        .build())
                .toList();

        List<TutorAvailabilityResponse.TimeSlot> freeSlots = computeFreeSlots(busySchedules);

        return TutorAvailabilityResponse.builder()
                .tutorId(tutorId)
                .date(date)
                .busySlots(busySlots)
                .freeSlots(freeSlots)
                .build();
    }

    // คำนวณ free slots จาก busy slots โดยแบ่งช่วงเวลาระหว่าง 08:00-22:00
    private List<TutorAvailabilityResponse.TimeSlot> computeFreeSlots(List<CourseSchedule> busySchedules) {
        final LocalTime DAY_START = LocalTime.of(8, 0);
        final LocalTime DAY_END = LocalTime.of(22, 0);

        List<TutorAvailabilityResponse.TimeSlot> freeSlots = new ArrayList<>();
        LocalTime cursor = DAY_START;

        for (CourseSchedule cs : busySchedules) {
            if (cursor.isBefore(cs.getStartTime())) {
                freeSlots.add(TutorAvailabilityResponse.TimeSlot.builder()
                        .startTime(cursor)
                        .endTime(cs.getStartTime())
                        .build());
            }
            if (cs.getEndTime().isAfter(cursor)) {
                cursor = cs.getEndTime();
            }
        }

        if (cursor.isBefore(DAY_END)) {
            freeSlots.add(TutorAvailabilityResponse.TimeSlot.builder()
                    .startTime(cursor)
                    .endTime(DAY_END)
                    .build());
        }

        return freeSlots;
    }

    private String buildCancelMessage(String courseName, String scheduleDate,
                                       String startTime, String endTime, String cancelReason) {
        return "เรียนคุณนักเรียน,\n\n" +
                "คลาสเรียน " + courseName + " วันที่ " + scheduleDate +
                " เวลา " + startTime + "-" + endTime + " ถูกยกเลิก\n\n" +
                "เหตุผล:\n" + cancelReason + "\n\n" +
                "กรุณาตรวจสอบตารางเรียนของคุณในระบบ\n\n" +
                "ขอแสดงความนับถือ\nTutor School System";
    }
}
