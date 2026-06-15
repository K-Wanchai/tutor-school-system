package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.CreateEnrollmentRequest;
import com.tutorschool.backend.dto.request.UpdateEnrollmentRequest;
import com.tutorschool.backend.dto.response.EnrollmentResponse;
import com.tutorschool.backend.entity.Course;
import com.tutorschool.backend.entity.CourseStatus;
import com.tutorschool.backend.entity.Enrollment;
import com.tutorschool.backend.entity.EnrollmentStatus;
import com.tutorschool.backend.entity.Student;
import com.tutorschool.backend.exception.DuplicateResourceException;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.mapper.EnrollmentMapper;
import com.tutorschool.backend.repository.CourseRepository;
import com.tutorschool.backend.repository.EnrollmentRepository;
import com.tutorschool.backend.repository.StudentRepository;
import com.tutorschool.backend.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EnrollmentServiceImpl implements EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentMapper enrollmentMapper;

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getEnrollmentsByStudentId(Long studentId) {
        if (!studentRepository.existsById(studentId)) {
            throw new ResourceNotFoundException("Student", studentId);
        }
        return enrollmentRepository.findByStudentId(studentId).stream()
                .map(enrollmentMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getEnrollmentsByCourseId(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course", courseId);
        }
        return enrollmentRepository.findByCourseId(courseId).stream()
                .map(enrollmentMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public EnrollmentResponse enrollStudent(CreateEnrollmentRequest request) {
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student", request.getStudentId()));

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", request.getCourseId()));

        if (course.getStatus() != CourseStatus.OPEN_FOR_REGISTRATION) {
            throw new IllegalStateException("Course is not open for registration");
        }

        if (enrollmentRepository.existsByStudentIdAndCourseId(request.getStudentId(), request.getCourseId())) {
            throw new DuplicateResourceException("Student is already enrolled in this course");
        }

        long currentEnrolled = enrollmentRepository.countByCourseIdAndStatus(
                request.getCourseId(), EnrollmentStatus.ACTIVE);
        if (currentEnrolled >= course.getSeatLimit()) {
            throw new IllegalStateException("Course has reached maximum enrollment capacity");
        }

        Enrollment enrollment = Enrollment.builder()
                .student(student)
                .course(course)
                .build();

        return enrollmentMapper.toResponse(enrollmentRepository.save(enrollment));
    }

    @Override
    @Transactional
    public EnrollmentResponse updateEnrollmentStatus(Long id, UpdateEnrollmentRequest request) {
        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", id));

        enrollment.setStatus(request.getStatus());
        return enrollmentMapper.toResponse(enrollmentRepository.save(enrollment));
    }

    @Override
    @Transactional
    public void cancelEnrollment(Long id) {
        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", id));

        enrollment.setStatus(EnrollmentStatus.CANCELLED);
        enrollmentRepository.save(enrollment);
    }
}
