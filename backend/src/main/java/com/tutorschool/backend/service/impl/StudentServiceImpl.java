package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.CreateStudentRequest;
import com.tutorschool.backend.dto.request.UpdateStudentRequest;
import com.tutorschool.backend.dto.request.UpdateStudentStatusRequest;
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
    public PageResponse<StudentResponse> getAllStudents(int page, int size, String keyword) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Student> studentPage = (keyword != null && !keyword.trim().isEmpty())
                ? studentRepository.searchStudents(keyword.trim(), pageable)
                : studentRepository.findAll(pageable);
        Page<StudentResponse> responsePage = studentPage.map(studentMapper::toResponse);
        return PageResponse.from(responsePage);
    }

    @Override
    @Transactional(readOnly = true)
    public StudentResponse getStudentById(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));
        return studentMapper.toResponse(student);
    }

    @Override
    @Transactional(readOnly = true)
    public StudentResponse getStudentByUserId(Long userId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for user id: " + userId));
        return studentMapper.toResponse(student);
    }

    @Override
    @Transactional(readOnly = true)
    public StudentResponse getStudentByCode(String studentCode) {
        Student student = studentRepository.findByStudentCode(studentCode)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with code: " + studentCode));
        return studentMapper.toResponse(student);
    }

    @Override
    @Transactional
    public StudentResponse createStudent(CreateStudentRequest request) {
        // ตรวจ duplicate ทั้ง 4 field ก่อน save
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username already taken: " + request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered: " + request.getEmail());
        }
        if (studentRepository.existsByStudentCode(request.getStudentCode())) {
            throw new DuplicateResourceException("Student code already exists: " + request.getStudentCode());
        }
        if (studentRepository.existsByNationalId(request.getNationalId())) {
            throw new DuplicateResourceException("National ID already registered: " + request.getNationalId());
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.STUDENT)
                .build();
        user = userRepository.save(user);

        // derive firstName/lastName from fullName if not explicitly provided
        String fullName = request.getFullName().trim();
        String[] nameParts = fullName.split(" ", 2);
        String firstName = (request.getFirstName() != null && !request.getFirstName().isBlank())
                ? request.getFirstName().trim() : nameParts[0];
        String lastName = (request.getLastName() != null && !request.getLastName().isBlank())
                ? request.getLastName().trim() : (nameParts.length > 1 ? nameParts[1] : nameParts[0]);

        Student student = Student.builder()
                .user(user)
                .studentCode(request.getStudentCode())
                .firstName(firstName)
                .lastName(lastName)
                .fullName(fullName)
                .nationalId(request.getNationalId())
                .address(request.getAddress())
                .phoneNumber(request.getPhoneNumber())
                .birthDate(request.getBirthDate())
                .guardianPhoneNumber(request.getGuardianPhoneNumber())
                .bankQrCode(request.getBankQrCode())
                .bankAccountName(request.getBankAccountName())
                .bankAccountNumber(request.getBankAccountNumber())
                .build();

        return studentMapper.toResponse(studentRepository.save(student));
    }

    @Override
    @Transactional
    public StudentResponse updateStudent(Long id, UpdateStudentRequest request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));

        boolean hasFn = request.getFirstName() != null && !request.getFirstName().isBlank();
        boolean hasLn = request.getLastName()  != null && !request.getLastName().isBlank();
        boolean hasFull = request.getFullName() != null && !request.getFullName().isBlank();

        String firstName, lastName, fullName;
        if (hasFn && hasLn) {
            firstName = request.getFirstName().trim();
            lastName  = request.getLastName().trim();
            fullName  = (firstName + " " + lastName).trim();
        } else if (hasFull) {
            fullName  = request.getFullName().trim();
            String[] parts = fullName.split(" ", 2);
            firstName = hasFn ? request.getFirstName().trim() : parts[0];
            lastName  = hasLn ? request.getLastName().trim()  : (parts.length > 1 ? parts[1] : parts[0]);
        } else {
            // ไม่ส่งมาเลย — ใช้ค่าเดิมจาก DB
            firstName = hasFn ? request.getFirstName().trim() : student.getFirstName();
            lastName  = hasLn ? request.getLastName().trim()  : student.getLastName();
            fullName  = (firstName + " " + lastName).trim();
        }

        student.setFirstName(firstName);
        student.setLastName(lastName);
        student.setFullName(fullName);
        student.setAddress(request.getAddress());
        student.setPhoneNumber(request.getPhoneNumber());
        student.setBirthDate(request.getBirthDate());
        student.setGuardianPhoneNumber(request.getGuardianPhoneNumber());
        if (request.getBankName() != null) {
            student.setBankName(request.getBankName());
        }
        student.setBankQrCode(request.getBankQrCode());
        student.setBankAccountName(request.getBankAccountName());
        student.setBankAccountNumber(request.getBankAccountNumber());

        return studentMapper.toResponse(studentRepository.save(student));
    }

    @Override
    @Transactional
    public StudentResponse updateMyProfile(Long userId, UpdateStudentRequest request) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for user id: " + userId));
        return updateStudent(student.getId(), request);
    }

    @Override
    @Transactional
    public StudentResponse updateStudentStatus(Long id, UpdateStudentStatusRequest request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));

        User user = student.getUser();
        user.setEnabled(request.getEnabled());
        userRepository.save(user);

        return studentMapper.toResponse(student);
    }

    @Override
    @Transactional
    public void deleteStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));
        // ลบ Student ก่อน แล้วค่อยลบ User (เพราะ FK constraint)
        studentRepository.delete(student);
        userRepository.delete(student.getUser());
    }
}
