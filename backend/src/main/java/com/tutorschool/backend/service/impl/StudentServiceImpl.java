package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.CreateStudentRequest;
import com.tutorschool.backend.dto.request.UpdateStudentRequest;
import com.tutorschool.backend.dto.response.PageResponse;
import com.tutorschool.backend.dto.response.StudentResponse;
import com.tutorschool.backend.entity.Role;
import com.tutorschool.backend.entity.Student;
import com.tutorschool.backend.entity.User;
import com.tutorschool.backend.exception.DuplicateResourceException;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.mapper.StudentMapper;
import com.tutorschool.backend.repository.StudentRepository;
import com.tutorschool.backend.repository.UserRepository;
import com.tutorschool.backend.service.StudentService;
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
public class StudentServiceImpl implements StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final StudentMapper studentMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StudentResponse> getAllStudents(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Student> studentPage = studentRepository.findAll(pageable);
        Page<StudentResponse> responsePage = studentPage.map(studentMapper::toResponse);
        return PageResponse.from(responsePage);
    }

    @Override
    @Transactional(readOnly = true)
    public StudentResponse getStudentById(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", id));
        return studentMapper.toResponse(student);
    }

    @Override
    @Transactional
    public StudentResponse createStudent(CreateStudentRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.STUDENT)
                .build();
        user = userRepository.save(user);

        Student student = Student.builder()
                .user(user)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .build();

        return studentMapper.toResponse(studentRepository.save(student));
    }

    @Override
    @Transactional
    public StudentResponse updateStudent(Long id, UpdateStudentRequest request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", id));

        student.setFirstName(request.getFirstName());
        student.setLastName(request.getLastName());
        student.setPhoneNumber(request.getPhoneNumber());

        return studentMapper.toResponse(studentRepository.save(student));
    }

    @Override
    @Transactional
    public void deleteStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", id));
        studentRepository.delete(student);
    }
}
