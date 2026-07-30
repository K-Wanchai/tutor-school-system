package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.CreateNotificationRequest;
import com.tutorschool.backend.dto.request.ForgotPasswordRequest;
import com.tutorschool.backend.dto.request.LoginRequest;
import com.tutorschool.backend.dto.request.RegisterRequest;
import com.tutorschool.backend.dto.request.ResetPasswordRequest;
import com.tutorschool.backend.dto.response.AuthResponse;
import com.tutorschool.backend.dto.response.AvailabilityResponse;
import com.tutorschool.backend.entity.NotificationType;
import com.tutorschool.backend.entity.Role;
import com.tutorschool.backend.entity.Student;
import com.tutorschool.backend.entity.User;
import com.tutorschool.backend.exception.DuplicateFieldsException;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.repository.StudentRepository;
import com.tutorschool.backend.repository.UserRepository;
import com.tutorschool.backend.security.JwtService;
import com.tutorschool.backend.service.AuthService;
import com.tutorschool.backend.service.EmailService;
import com.tutorschool.backend.service.NotificationService;
import com.tutorschool.backend.service.StudentCodeGeneratorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    // ลิงก์รีเซ็ตรหัสผ่านมีอายุ 30 นาที
    private static final int RESET_TOKEN_EXPIRY_MINUTES = 30;
    // กันสแปม: ถ้าเพิ่งขอลิงก์รีเซ็ตไปไม่ถึง 1 นาที ไม่ออก token ใหม่/ส่งอีเมลซ้ำ
    private static final int RESET_REQUEST_COOLDOWN_MINUTES = 1;

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final StudentCodeGeneratorService studentCodeGeneratorService;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

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

    // เสมอ "สำเร็จ" ต่อผู้เรียกไม่ว่าอีเมลนี้จะมีอยู่ในระบบหรือไม่ (กัน user enumeration) —
    // ไม่โยน exception เมื่อหาไม่เจอ ปล่อยให้ controller ตอบข้อความ generic เดียวกันเสมอ
    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            LocalDateTime now = LocalDateTime.now();

            // ถ้า token เดิมยังไม่หมดอายุและเพิ่งออกให้ไม่ถึง cooldown ก็ไม่ต้องออกใหม่/ส่งอีเมลซ้ำ
            LocalDateTime issuedAt = user.getResetPasswordTokenExpiry() != null
                    ? user.getResetPasswordTokenExpiry().minusMinutes(RESET_TOKEN_EXPIRY_MINUTES)
                    : null;
            if (issuedAt != null && issuedAt.isAfter(now.minusMinutes(RESET_REQUEST_COOLDOWN_MINUTES))) {
                log.info("Password reset requested too soon for user {}, skipping resend", user.getId());
                return;
            }

            String token = UUID.randomUUID().toString();
            user.setResetPasswordToken(token);
            user.setResetPasswordTokenExpiry(now.plusMinutes(RESET_TOKEN_EXPIRY_MINUTES));
            userRepository.save(user);

            String resetLink = frontendUrl + "/reset-password?token=" + token;
            try {
                CreateNotificationRequest notif = new CreateNotificationRequest();
                notif.setUserId(user.getId());
                notif.setRecipientEmail(user.getEmail());
                notif.setSubject("คำขอตั้งรหัสผ่านใหม่");
                notif.setMessage(emailService.buildPasswordResetEmail(
                        user.getLoginUsername(), resetLink, RESET_TOKEN_EXPIRY_MINUTES));
                notif.setNotificationType(NotificationType.PASSWORD_RESET_REQUESTED);
                notificationService.sendNotification(notif);
            } catch (Exception e) {
                log.warn("Failed to send password-reset email to {}: {}", user.getEmail(), e.getMessage());
            }
        });
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByResetPasswordToken(request.getToken())
                .orElseThrow(() -> new IllegalArgumentException("ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือถูกใช้ไปแล้ว"));

        if (user.getResetPasswordTokenExpiry() == null || user.getResetPasswordTokenExpiry().isBefore(LocalDateTime.now())) {
            user.setResetPasswordToken(null);
            user.setResetPasswordTokenExpiry(null);
            userRepository.save(user);
            throw new IllegalArgumentException("ลิงก์รีเซ็ตรหัสผ่านหมดอายุแล้ว กรุณาขอลิงก์ใหม่อีกครั้ง");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        // token ใช้ได้ครั้งเดียว — ล้างทิ้งทันทีหลังใช้สำเร็จ
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiry(null);
        userRepository.save(user);

        try {
            CreateNotificationRequest notif = new CreateNotificationRequest();
            notif.setUserId(user.getId());
            notif.setRecipientEmail(user.getEmail());
            notif.setSubject("รหัสผ่านของคุณถูกเปลี่ยน");
            notif.setMessage(emailService.buildPasswordChangedEmail(user.getLoginUsername()));
            notif.setNotificationType(NotificationType.PASSWORD_CHANGED);
            notificationService.sendNotification(notif);
        } catch (Exception e) {
            log.warn("Failed to send password-changed notification for user {}: {}", user.getId(), e.getMessage());
        }
    }
}
