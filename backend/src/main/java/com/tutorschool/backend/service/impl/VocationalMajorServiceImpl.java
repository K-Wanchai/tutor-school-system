package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.SaveVocationalMajorRequest;
import com.tutorschool.backend.dto.response.VocationalMajorResponse;
import com.tutorschool.backend.entity.ExamInstitution;
import com.tutorschool.backend.entity.InstitutionType;
import com.tutorschool.backend.entity.VocationalMajor;
import com.tutorschool.backend.exception.DuplicateResourceException;
import com.tutorschool.backend.exception.ExamInstitutionNotFoundException;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.mapper.VocationalMajorMapper;
import com.tutorschool.backend.repository.ExamInstitutionRepository;
import com.tutorschool.backend.repository.VocationalMajorRepository;
import com.tutorschool.backend.service.VocationalMajorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VocationalMajorServiceImpl implements VocationalMajorService {

    private final VocationalMajorRepository vocationalMajorRepository;
    private final ExamInstitutionRepository examInstitutionRepository;
    private final VocationalMajorMapper vocationalMajorMapper;

    @Override
    @Transactional(readOnly = true)
    public List<VocationalMajorResponse> getMajors(Long institutionId) {
        findInstitution(institutionId);
        return vocationalMajorRepository.findByExamInstitutionIdOrderByNameAsc(institutionId).stream()
                .map(vocationalMajorMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public VocationalMajorResponse createMajor(Long institutionId, SaveVocationalMajorRequest request) {
        ExamInstitution institution = findVocationalInstitution(institutionId);

        String name = request.getName().trim();
        if (vocationalMajorRepository.existsByExamInstitutionIdAndNameIgnoreCase(institutionId, name)) {
            throw new DuplicateResourceException("มีชื่อสาขานี้อยู่ในสถาบันนี้แล้ว: " + name);
        }

        VocationalMajor major = VocationalMajor.builder()
                .examInstitution(institution)
                .name(name)
                .active(request.getActive() == null ? Boolean.TRUE : request.getActive())
                .build();

        return vocationalMajorMapper.toResponse(vocationalMajorRepository.save(major));
    }

    @Override
    @Transactional
    public VocationalMajorResponse updateMajor(Long institutionId, Long majorId, SaveVocationalMajorRequest request) {
        findVocationalInstitution(institutionId);
        VocationalMajor major = findMajor(institutionId, majorId);

        String newName = request.getName().trim();
        boolean sameName = major.getName().equalsIgnoreCase(newName);
        if (!sameName && vocationalMajorRepository.existsByExamInstitutionIdAndNameIgnoreCaseAndIdNot(
                institutionId, newName, majorId)) {
            throw new DuplicateResourceException("มีชื่อสาขานี้อยู่ในสถาบันนี้แล้ว: " + newName);
        }

        major.setName(newName);
        if (request.getActive() != null) {
            major.setActive(request.getActive());
        }

        return vocationalMajorMapper.toResponse(vocationalMajorRepository.save(major));
    }

    @Override
    @Transactional
    public void deleteMajor(Long institutionId, Long majorId) {
        findVocationalInstitution(institutionId);
        VocationalMajor major = findMajor(institutionId, majorId);
        major.setActive(false);
        vocationalMajorRepository.save(major);
    }

    private ExamInstitution findInstitution(Long institutionId) {
        return examInstitutionRepository.findById(institutionId)
                .orElseThrow(() -> new ExamInstitutionNotFoundException("ไม่พบข้อมูลสถาบันที่จัดสอบ รหัส: " + institutionId));
    }

    private ExamInstitution findVocationalInstitution(Long institutionId) {
        ExamInstitution institution = findInstitution(institutionId);
        boolean isVocational = institution.getInstitutionType() == InstitutionType.VOCATIONAL_DIPLOMA;
        boolean isUniversityWithVocational = institution.getInstitutionType() == InstitutionType.UNIVERSITY
                && Boolean.TRUE.equals(institution.getOffersVocationalDiploma());
        if (!isVocational && !isUniversityWithVocational) {
            throw new IllegalStateException("สาขา (ปวส.) ใช้ได้เฉพาะสถาบันประเภทอนุปริญญา หรือมหาวิทยาลัยที่เปิดหลักสูตรอนุปริญญาเท่านั้น");
        }
        return institution;
    }

    private VocationalMajor findMajor(Long institutionId, Long majorId) {
        VocationalMajor major = vocationalMajorRepository.findById(majorId)
                .orElseThrow(() -> new ResourceNotFoundException("ไม่พบข้อมูลสาขา รหัส: " + majorId));
        if (!major.getExamInstitution().getId().equals(institutionId)) {
            throw new ResourceNotFoundException("ไม่พบข้อมูลสาขาในสถาบันนี้ รหัส: " + majorId);
        }
        return major;
    }
}
