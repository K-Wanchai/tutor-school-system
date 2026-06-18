package com.tutorschool.backend.service.impl;

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
import com.tutorschool.backend.dto.request.UpdateCourseRequest;
import com.tutorschool.backend.dto.request.UpdateCourseStatusRequest;
import com.tutorschool.backend.dto.response.CourseResponse;
import com.tutorschool.backend.dto.response.PageResponse;
import com.tutorschool.backend.entity.Course;
import com.tutorschool.backend.entity.CourseLesson;
import com.tutorschool.backend.entity.CourseStatus;
import com.tutorschool.backend.entity.CourseTest;
import com.tutorschool.backend.entity.EnrollmentStatus;
import com.tutorschool.backend.entity.Tutor;
import com.tutorschool.backend.exception.DuplicateResourceException;
import com.tutorschool.backend.exception.InvalidCourseDateException;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.mapper.CourseMapper;
import com.tutorschool.backend.repository.CourseRepository;
import com.tutorschool.backend.repository.EnrollmentRepository;
import com.tutorschool.backend.repository.TutorRepository;
import com.tutorschool.backend.service.CourseService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final TutorRepository TutorRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseMapper courseMapper;

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
    @Transactional
    public CourseResponse createCourse(CreateCourseRequest request) {
        if (courseRepository.existsByCourseCode(request.getCourseCode())) {
            throw new DuplicateResourceException("Course code already exists: " + request.getCourseCode());
        }

        Tutor Tutor = TutorRepository.findById(request.getTutorId())
                .orElseThrow(() -> new ResourceNotFoundException("Tutor", request.getTutorId()));

        validateCourseDates(request.getRegistrationStartDate(),
                request.getRegistrationEndDate(),
                request.getCourseStartDate());

        CourseStatus status = (request.getStatus() != null) ? request.getStatus() : CourseStatus.DRAFT;

        Course course = Course.builder()
                .courseCode(request.getCourseCode())
                .courseName(request.getCourseName())
                .price(request.getPrice())
                .description(request.getDescription())
                .totalHours(request.getTotalHours())
                .seatLimit(request.getSeatLimit())
                .registrationStartDate(request.getRegistrationStartDate())
                .registrationEndDate(request.getRegistrationEndDate())
                .courseStartDate(request.getCourseStartDate())
                .status(status)
                .tutor(Tutor)
                .build();

        addLessonsToCoure(course, request.getLessons());
        addTestsToCourse(course, request.getTests());

        course = courseRepository.save(course);
        return courseMapper.toDetailResponse(course, 0L);
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
    public void deleteCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", id));
        courseRepository.delete(course);
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
