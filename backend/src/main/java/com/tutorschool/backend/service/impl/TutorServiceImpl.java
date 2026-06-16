package com.tutorschool.backend.service.impl;

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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TutorServiceImpl implements TutorService {

    private final TutorRepository TutorRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TutorMapper TutorMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<TutorResponse> getAllTeachers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Tutor> teacherPage = TutorRepository.findAll(pageable);
        Page<TutorResponse> responsePage = teacherPage.map(TutorMapper::toResponse);
        return PageResponse.from(responsePage);
    }

    @Override
    @Transactional(readOnly = true)
    public TutorResponse getTeacherById(Long id) {
        Tutor Tutor = TutorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tutor", id));
        return TutorMapper.toResponse(Tutor);
    }

    @Override
    @Transactional
    public TutorResponse createTeacher(CreateTutorRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.Tutor)
                .build();
        user = userRepository.save(user);

        Tutor Tutor = Tutor.builder()
                .user(user)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .specialization(request.getSpecialization())
                .bio(request.getBio())
                .build();

        return TutorMapper.toResponse(TutorRepository.save(Tutor));
    }

    @Override
    @Transactional
    public TutorResponse updateTeacher(Long id, UpdateTutorRequest request) {
        Tutor Tutor = TutorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tutor", id));

        Tutor.setFirstName(request.getFirstName());
        Tutor.setLastName(request.getLastName());
        Tutor.setPhoneNumber(request.getPhoneNumber());
        Tutor.setSpecialization(request.getSpecialization());
        Tutor.setBio(request.getBio());

        return TutorMapper.toResponse(TutorRepository.save(Tutor));
    }

    @Override
    @Transactional
    public void deleteTeacher(Long id) {
        Tutor Tutor = TutorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tutor", id));
        TutorRepository.delete(Tutor);
    }
}
