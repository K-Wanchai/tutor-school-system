package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.LoginRequest;
import com.tutorschool.backend.dto.request.RegisterRequest;
import com.tutorschool.backend.dto.response.AuthResponse;
import com.tutorschool.backend.entity.Role;
import com.tutorschool.backend.entity.Student;
import com.tutorschool.backend.entity.User;
import com.tutorschool.backend.exception.DuplicateResourceException;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.repository.StudentRepository;
import com.tutorschool.backend.repository.UserRepository;
import com.tutorschool.backend.security.JwtService;
import com.tutorschool.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Override
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String accessToken = jwtService.generateAccessToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
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

        studentRepository.save(student);

        String accessToken = jwtService.generateAccessToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}
