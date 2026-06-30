package com.tutorschool.backend.service.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tutorschool.backend.dto.request.CreateTutorRequest;
import com.tutorschool.backend.dto.request.UpdateTutorRequest;
import com.tutorschool.backend.dto.response.PageResponse;
import com.tutorschool.backend.dto.response.TutorResponse;
import com.tutorschool.backend.entity.Role;
import com.tutorschool.backend.entity.Tutor;
import com.tutorschool.backend.entity.User;
import com.tutorschool.backend.exception.DuplicateResourceException;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.mapper.TutorMapper;
import com.tutorschool.backend.repository.TutorRepository;
import com.tutorschool.backend.repository.UserRepository;
import com.tutorschool.backend.service.TutorService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TutorServiceImpl implements TutorService {

    private final TutorRepository tutorRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TutorMapper tutorMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<TutorResponse> getAllTeachers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Tutor> tutorPage = tutorRepository.findAll(pageable);
        Page<TutorResponse> responsePage = tutorPage.map(tutorMapper::toResponse);
        return PageResponse.from(responsePage);
    }

    @Override
    @Transactional(readOnly = true)
    public TutorResponse getTeacherById(Long id) {
        Tutor tutor = tutorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tutor", id));
        return tutorMapper.toResponse(tutor);
    }

    @Override
    @Transactional(readOnly = true)
    public TutorResponse getTutorByUserId(Long userId) {
        Tutor tutor = tutorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tutor profile not found for user id: " + userId));
        return tutorMapper.toResponse(tutor);
    }

    @Override
    @Transactional
    public TutorResponse createTeacher(CreateTutorRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered: " + request.getEmail());
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username already taken: " + request.getUsername());
        }

        User user = User.builder()
    .username(request.getUsername())
    .email(request.getEmail())
    .password(passwordEncoder.encode(request.getPassword()))
    .role(Role.TUTOR)
    .build();
        user = userRepository.save(user);

        Tutor tutor = Tutor.builder()
                .user(user)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .specialization(request.getSpecialization())
                .bio(request.getBio())
                .build();

        return tutorMapper.toResponse(tutorRepository.save(tutor));
    }

    @Override
    @Transactional
    public TutorResponse updateTeacher(Long id, UpdateTutorRequest request) {
        Tutor tutor = tutorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tutor", id));

        tutor.setFirstName(request.getFirstName());
        tutor.setLastName(request.getLastName());
        tutor.setPhoneNumber(request.getPhoneNumber());
        tutor.setSpecialization(request.getSpecialization());
        tutor.setBio(request.getBio());

        return tutorMapper.toResponse(tutorRepository.save(tutor));
    }

    @Override
    @Transactional
    public TutorResponse updateMyProfile(Long userId, UpdateTutorRequest request) {
        Tutor tutor = tutorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tutor profile not found for user id: " + userId));
        return updateTeacher(tutor.getId(), request);
    }

    @Override
    @Transactional
    public void deleteTeacher(Long id) {
        Tutor tutor = tutorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tutor", id));
        tutorRepository.delete(tutor);
    }

    @Override
    @Transactional
    public TutorResponse toggleStatus(Long id, boolean enabled) {
        Tutor tutor = tutorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tutor", id));
        tutor.getUser().setEnabled(enabled);
        userRepository.save(tutor.getUser());
        return tutorMapper.toResponse(tutor);
    }
}
