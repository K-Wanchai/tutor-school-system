package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.LoginRequest;
import com.tutorschool.backend.dto.request.RegisterRequest;
import com.tutorschool.backend.dto.response.AuthResponse;
import com.tutorschool.backend.dto.response.AvailabilityResponse;
import org.springframework.web.multipart.MultipartFile;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    AuthResponse register(RegisterRequest request, MultipartFile qrCodeFile);

    AvailabilityResponse checkAvailability(String field, String value);
}
