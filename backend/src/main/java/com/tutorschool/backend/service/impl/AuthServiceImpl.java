package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.LoginRequest;
import com.tutorschool.backend.dto.request.RegisterRequest;
import com.tutorschool.backend.dto.response.AuthResponse;
import com.tutorschool.backend.dto.response.AvailabilityResponse;
import com.tutorschool.backend.entity.Role;
import com.tutorschool.backend.entity.Student;
import com.tutorschool.backend.entity.User;
import com.tutorschool.backend.exception.DuplicateFieldsException;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.repository.StudentRepository;
import com.tutorschool.backend.repository.UserRepository;
import com.tutorschool.backend.security.JwtService;
import com.tutorschool.backend.service.AuthService;
import com.tutorschool.backend.service.StudentCodeGeneratorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final StudentCodeGeneratorService studentCodeGeneratorService;

    @Override
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsernameOrEmail(), request.getPassword()));

        User user = userRepository.findByEmailOrUsername(request.getUsernameOrEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String accessToken  = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("register attempt: username={}, email={}", request.getUsername(), request.getEmail());

        // ตรวจ duplicate ทั้ง 3 field ก่อน (ก่อน I/O ใดๆ)
        Map<String, String> duplicateErrors = new LinkedHashMap<>();
        if (userRepository.existsByUsername(request.getUsername())) {
            duplicateErrors.put("username", "ชื่อผู้ใช้นี้ถูกใช้แล้ว");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            duplicateErrors.put("email", "อีเมลนี้ถูกใช้แล้ว");
        }
        if (studentRepository.existsByNationalId(request.getNationalId())) {
            duplicateErrors.put("nationalId", "เลขบัตรประชาชนนี้ถูกใช้แล้ว");
        }
        if (!duplicateErrors.isEmpty()) {
            log.warn("register duplicate fields: {}", duplicateErrors);
            throw new DuplicateFieldsException(duplicateErrors);
        }

        // สร้าง User (role = STUDENT เสมอ สำหรับการสมัครเอง)
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.STUDENT)
                .build();
        user = userRepository.save(user);
        log.info("user created: id={}, username={}", user.getId(), user.getUsername());

        // สร้าง Student record พร้อม auto-generated studentCode (รูปแบบ {ปี พ.ศ. 2 หลัก}{เลขรัน 5 หลัก})
        String studentCode = studentCodeGeneratorService.generateNextCode();

        Student student = Student.builder()
                .user(user)
                .studentCode(studentCode)
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .fullName(request.getFirstName().trim() + " " + request.getLastName().trim())
                .nationalId(request.getNationalId())
                .address(request.getAddress())
                .phoneNumber(request.getPhone())
                .birthDate(request.getBirthDate())
                .currentSchool(request.getCurrentSchool().trim())
                .gradeLevel(request.getGradeLevel())
                .guardianPhoneNumber(request.getParentPhone())
                .build();
        studentRepository.save(student);
        log.info("student created: id={}, code={}", student.getId(), studentCode);

        String accessToken  = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    @Override
    public AvailabilityResponse checkAvailability(String field, String value) {
        boolean taken = switch (field) {
            case "username" -> userRepository.existsByUsername(value);
            case "email" -> userRepository.existsByEmail(value);
            case "nationalId" -> studentRepository.existsByNationalId(value);
            default -> throw new IllegalArgumentException("Unsupported field: " + field);
        };
        return AvailabilityResponse.builder()
                .field(field)
                .available(!taken)
                .build();
    }
}
