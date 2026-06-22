package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.LoginRequest;
import com.tutorschool.backend.dto.request.RegisterRequest;
import com.tutorschool.backend.dto.response.AuthResponse;
import com.tutorschool.backend.entity.Role;
import com.tutorschool.backend.entity.Student;
import com.tutorschool.backend.entity.User;
import com.tutorschool.backend.exception.DuplicateFieldsException;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.repository.StudentRepository;
import com.tutorschool.backend.repository.UserRepository;
import com.tutorschool.backend.security.JwtService;
import com.tutorschool.backend.service.AuthService;
import com.tutorschool.backend.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final FileStorageService fileStorageService;

    @Override
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsernameOrEmail(), request.getPassword()));

        User user = userRepository.findByEmailOrUsername(request.getUsernameOrEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String accessToken = jwtService.generateAccessToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request, MultipartFile qrCodeFile) {
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

        // บันทึกไฟล์ก่อน แล้วค่อย save ลง DB
        String qrPath = null;
        if (qrCodeFile != null && !qrCodeFile.isEmpty()) {
            qrPath = fileStorageService.saveQrCode(qrCodeFile);
        }

        try {
            // สร้าง User (role = STUDENT เสมอ สำหรับการสมัครเอง)
            User user = User.builder()
                    .username(request.getUsername())
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role(Role.STUDENT)
                    .build();
            user = userRepository.save(user);
            log.info("user created: id={}, username={}", user.getId(), user.getUsername());

            // สร้าง Student record พร้อม auto-generated studentCode
            String studentCode = "STU" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();

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
                    .guardianPhoneNumber(request.getParentPhone())
                    .bankName(request.getBankName())
                    .bankAccountName(request.getAccountName())
                    .bankAccountNumber(request.getAccountNumber())
                    .bankQrCode(qrPath)
                    .build();
            studentRepository.save(student);
            log.info("student created: id={}, code={}", student.getId(), studentCode);

            String accessToken = jwtService.generateAccessToken(user);

            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .tokenType("Bearer")
                    .userId(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .role(user.getRole().name())
                    .build();

        } catch (Exception e) {
            // ถ้า DB fail ให้ลบไฟล์ที่ upload ไว้ (ป้องกัน orphan files)
            fileStorageService.deleteFile(qrPath);
            throw e;
        }
    }
}
