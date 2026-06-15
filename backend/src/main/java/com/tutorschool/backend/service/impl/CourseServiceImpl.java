package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.CreateCourseRequest;
import com.tutorschool.backend.dto.request.UpdateCourseRequest;
import com.tutorschool.backend.dto.response.CourseResponse;
import com.tutorschool.backend.dto.response.PageResponse;
import com.tutorschool.backend.entity.Course;
import com.tutorschool.backend.entity.EnrollmentStatus;
import com.tutorschool.backend.entity.Teacher;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.mapper.CourseMapper;
import com.tutorschool.backend.repository.CourseRepository;
import com.tutorschool.backend.repository.EnrollmentRepository;
import com.tutorschool.backend.repository.TeacherRepository;
import com.tutorschool.backend.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final TeacherRepository teacherRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseMapper courseMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CourseResponse> getAllCourses(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Course> coursePage = courseRepository.findAll(pageable);
        Page<CourseResponse> responsePage = coursePage.map(course -> {
            long count = enrollmentRepository.countByCourseIdAndStatus(course.getId(), EnrollmentStatus.ACTIVE);
            return courseMapper.toResponse(course, count);
        });
        return PageResponse.from(responsePage);
    }

    @Override
    @Transactional(readOnly = true)
    public CourseResponse getCourseById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", id));
        long enrolledCount = enrollmentRepository.countByCourseIdAndStatus(id, EnrollmentStatus.ACTIVE);
        return courseMapper.toResponse(course, enrolledCount);
    }

    @Override
    @Transactional
    public CourseResponse createCourse(CreateCourseRequest request) {
        Teacher teacher = null;
        if (request.getTeacherId() != null) {
            teacher = teacherRepository.findById(request.getTeacherId())
                    .orElseThrow(() -> new ResourceNotFoundException("Teacher", request.getTeacherId()));
        }

        Course course = Course.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .teacher(teacher)
                .maxStudents(request.getMaxStudents())
                .build();

        course = courseRepository.save(course);
        return courseMapper.toResponse(course, 0L);
    }

    @Override
    @Transactional
    public CourseResponse updateCourse(Long id, UpdateCourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", id));

        Teacher teacher = null;
        if (request.getTeacherId() != null) {
            teacher = teacherRepository.findById(request.getTeacherId())
                    .orElseThrow(() -> new ResourceNotFoundException("Teacher", request.getTeacherId()));
        }

        course.setName(request.getName());
        course.setDescription(request.getDescription());
        course.setPrice(request.getPrice());
        course.setTeacher(teacher);
        course.setMaxStudents(request.getMaxStudents());
        if (request.getActive() != null) {
            course.setActive(request.getActive());
        }

        course = courseRepository.save(course);
        long enrolledCount = enrollmentRepository.countByCourseIdAndStatus(id, EnrollmentStatus.ACTIVE);
        return courseMapper.toResponse(course, enrolledCount);
    }

    @Override
    @Transactional
    public void deleteCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", id));
        courseRepository.delete(course);
    }
}
