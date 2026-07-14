package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.SaveAcademicFacultyRequest;
import com.tutorschool.backend.dto.response.AcademicFacultyResponse;
import com.tutorschool.backend.entity.AcademicFaculty;
import com.tutorschool.backend.entity.ExamInstitution;
import com.tutorschool.backend.entity.InstitutionType;
import com.tutorschool.backend.exception.DuplicateResourceException;
import com.tutorschool.backend.exception.ExamInstitutionNotFoundException;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.mapper.AcademicFacultyMapper;
import com.tutorschool.backend.repository.AcademicFacultyRepository;
import com.tutorschool.backend.repository.ExamInstitutionRepository;
import com.tutorschool.backend.service.AcademicFacultyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AcademicFacultyServiceImpl implements AcademicFacultyService {

    private final AcademicFacultyRepository academicFacultyRepository;
    private final ExamInstitutionRepository examInstitutionRepository;
    private final AcademicFacultyMapper academicFacultyMapper;

    @Override
    @Transactional(readOnly = true)
    public List<AcademicFacultyResponse> getFaculties(Long institutionId) {
        findInstitution(institutionId);
        return academicFacultyRepository.findByExamInstitutionIdOrderByNameAsc(institutionId).stream()
                .map(academicFacultyMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public AcademicFacultyResponse createFaculty(Long institutionId, SaveAcademicFacultyRequest request) {
        ExamInstitution institution = findUniversity(institutionId);

        String name = request.getName().trim();
        if (academicFacultyRepository.existsByExamInstitutionIdAndNameIgnoreCase(institutionId, name)) {
            throw new DuplicateResourceException("มีชื่อคณะนี้อยู่ในสถาบันแล้ว: " + name);
        }

        AcademicFaculty faculty = AcademicFaculty.builder()
                .examInstitution(institution)
                .name(name)
                .active(request.getActive() == null ? Boolean.TRUE : request.getActive())
                .build();

        return academicFacultyMapper.toResponse(academicFacultyRepository.save(faculty));
    }

    @Override
    @Transactional
    public AcademicFacultyResponse updateFaculty(Long institutionId, Long facultyId, SaveAcademicFacultyRequest request) {
        findUniversity(institutionId);
        AcademicFaculty faculty = findFaculty(institutionId, facultyId);

        String newName = request.getName().trim();
        if (!faculty.getName().equalsIgnoreCase(newName)
                && academicFacultyRepository.existsByExamInstitutionIdAndNameIgnoreCaseAndIdNot(institutionId, newName, facultyId)) {
            throw new DuplicateResourceException("มีชื่อคณะนี้อยู่ในสถาบันแล้ว: " + newName);
        }

        faculty.setName(newName);
        if (request.getActive() != null) {
            faculty.setActive(request.getActive());
        }

        return academicFacultyMapper.toResponse(academicFacultyRepository.save(faculty));
    }

    @Override
    @Transactional
    public void deleteFaculty(Long institutionId, Long facultyId) {
        findUniversity(institutionId);
        AcademicFaculty faculty = findFaculty(institutionId, facultyId);
        faculty.setActive(false);
        academicFacultyRepository.save(faculty);
    }

    private ExamInstitution findInstitution(Long institutionId) {
        return examInstitutionRepository.findById(institutionId)
                .orElseThrow(() -> new ExamInstitutionNotFoundException("ไม่พบข้อมูลสถาบันที่จัดสอบ รหัส: " + institutionId));
    }

    private ExamInstitution findUniversity(Long institutionId) {
        ExamInstitution institution = findInstitution(institutionId);
        if (institution.getInstitutionType() != InstitutionType.UNIVERSITY) {
            throw new IllegalStateException("คณะ/สาขาใช้ได้เฉพาะสถาบันประเภทมหาวิทยาลัยเท่านั้น");
        }
        return institution;
    }

    private AcademicFaculty findFaculty(Long institutionId, Long facultyId) {
        AcademicFaculty faculty = academicFacultyRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("ไม่พบข้อมูลคณะ รหัส: " + facultyId));
        if (!faculty.getExamInstitution().getId().equals(institutionId)) {
            throw new ResourceNotFoundException("ไม่พบข้อมูลคณะในสถาบันนี้ รหัส: " + facultyId);
        }
        return faculty;
    }
}
