package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.SaveAcademicMajorRequest;
import com.tutorschool.backend.dto.response.AcademicMajorResponse;
import com.tutorschool.backend.entity.AcademicFaculty;
import com.tutorschool.backend.entity.AcademicMajor;
import com.tutorschool.backend.exception.DuplicateResourceException;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.mapper.AcademicMajorMapper;
import com.tutorschool.backend.repository.AcademicFacultyRepository;
import com.tutorschool.backend.repository.AcademicMajorRepository;
import com.tutorschool.backend.service.AcademicMajorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AcademicMajorServiceImpl implements AcademicMajorService {

    private final AcademicMajorRepository academicMajorRepository;
    private final AcademicFacultyRepository academicFacultyRepository;
    private final AcademicMajorMapper academicMajorMapper;

    @Override
    @Transactional(readOnly = true)
    public List<AcademicMajorResponse> getMajors(Long institutionId, Long facultyId) {
        findFaculty(institutionId, facultyId);
        return academicMajorRepository.findByFacultyIdOrderByNameAsc(facultyId).stream()
                .map(academicMajorMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public AcademicMajorResponse createMajor(Long institutionId, Long facultyId, SaveAcademicMajorRequest request) {
        AcademicFaculty faculty = findFaculty(institutionId, facultyId);

        String name = request.getName().trim();
        if (academicMajorRepository.existsByFacultyIdAndNameIgnoreCase(facultyId, name)) {
            throw new DuplicateResourceException("มีชื่อสาขานี้อยู่ในคณะแล้ว: " + name);
        }

        AcademicMajor major = AcademicMajor.builder()
                .faculty(faculty)
                .name(name)
                .active(request.getActive() == null ? Boolean.TRUE : request.getActive())
                .build();

        return academicMajorMapper.toResponse(academicMajorRepository.save(major));
    }

    @Override
    @Transactional
    public AcademicMajorResponse updateMajor(Long institutionId, Long facultyId, Long majorId, SaveAcademicMajorRequest request) {
        findFaculty(institutionId, facultyId);
        AcademicMajor major = findMajor(facultyId, majorId);

        String newName = request.getName().trim();
        if (!major.getName().equalsIgnoreCase(newName)
                && academicMajorRepository.existsByFacultyIdAndNameIgnoreCaseAndIdNot(facultyId, newName, majorId)) {
            throw new DuplicateResourceException("มีชื่อสาขานี้อยู่ในคณะแล้ว: " + newName);
        }

        major.setName(newName);
        if (request.getActive() != null) {
            major.setActive(request.getActive());
        }

        return academicMajorMapper.toResponse(academicMajorRepository.save(major));
    }

    @Override
    @Transactional
    public void deleteMajor(Long institutionId, Long facultyId, Long majorId) {
        findFaculty(institutionId, facultyId);
        AcademicMajor major = findMajor(facultyId, majorId);
        major.setActive(false);
        academicMajorRepository.save(major);
    }

    private AcademicFaculty findFaculty(Long institutionId, Long facultyId) {
        AcademicFaculty faculty = academicFacultyRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("ไม่พบข้อมูลคณะ รหัส: " + facultyId));
        if (!faculty.getExamInstitution().getId().equals(institutionId)) {
            throw new ResourceNotFoundException("ไม่พบข้อมูลคณะในสถาบันนี้ รหัส: " + facultyId);
        }
        return faculty;
    }

    private AcademicMajor findMajor(Long facultyId, Long majorId) {
        AcademicMajor major = academicMajorRepository.findById(majorId)
                .orElseThrow(() -> new ResourceNotFoundException("ไม่พบข้อมูลสาขา รหัส: " + majorId));
        if (!major.getFaculty().getId().equals(facultyId)) {
            throw new ResourceNotFoundException("ไม่พบข้อมูลสาขาในคณะนี้ รหัส: " + majorId);
        }
        return major;
    }
}
