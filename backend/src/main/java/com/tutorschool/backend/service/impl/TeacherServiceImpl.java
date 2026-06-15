package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.CreateTeacherRequest;
import com.tutorschool.backend.dto.request.UpdateTeacherRequest;
import com.tutorschool.backend.dto.response.PageResponse;
import com.tutorschool.backend.dto.response.TeacherResponse;
import com.tutorschool.backend.entity.Role;
import com.tutorschool.backend.entity.Teacher;
import com.tutorschool.backend.entity.User;
import com.tutorschool.backend.exception.DuplicateResourceException;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.mapper.TeacherMapper;
import com.tutorschool.backend.repository.TeacherRepository;
import com.tutorschool.backend.repository.UserRepository;
import com.tutorschool.backend.service.TeacherService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TeacherServiceImpl implements TeacherService {

    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TeacherMapper teacherMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<TeacherResponse> getAllTeachers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Teacher> teacherPage = teacherRepository.findAll(pageable);
        Page<TeacherResponse> responsePage = teacherPage.map(teacherMapper::toResponse);
        return PageResponse.from(responsePage);
    }

    @Override
    @Transactional(readOnly = true)
    public TeacherResponse getTeacherById(Long id) {
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", id));
        return teacherMapper.toResponse(teacher);
    }

    @Override
    @Transactional
    public TeacherResponse createTeacher(CreateTeacherRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.TEACHER)
                .build();
        user = userRepository.save(user);

        Teacher teacher = Teacher.builder()
                .user(user)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .specialization(request.getSpecialization())
                .bio(request.getBio())
                .build();

        return teacherMapper.toResponse(teacherRepository.save(teacher));
    }

    @Override
    @Transactional
    public TeacherResponse updateTeacher(Long id, UpdateTeacherRequest request) {
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", id));

        teacher.setFirstName(request.getFirstName());
        teacher.setLastName(request.getLastName());
        teacher.setPhoneNumber(request.getPhoneNumber());
        teacher.setSpecialization(request.getSpecialization());
        teacher.setBio(request.getBio());

        return teacherMapper.toResponse(teacherRepository.save(teacher));
    }

    @Override
    @Transactional
    public void deleteTeacher(Long id) {
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", id));
        teacherRepository.delete(teacher);
    }
}
