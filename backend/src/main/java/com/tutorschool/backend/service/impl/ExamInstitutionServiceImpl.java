package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.ExamInstitutionRequest;
import com.tutorschool.backend.dto.response.AchievementStudentCardResponse;
import com.tutorschool.backend.dto.response.AchievementSummaryResponse;
import com.tutorschool.backend.dto.response.ExamInstitutionResponse;
import com.tutorschool.backend.dto.response.InstitutionAchievementOverviewResponse;
import com.tutorschool.backend.entity.ExamInstitution;
import com.tutorschool.backend.entity.InstitutionType;
import com.tutorschool.backend.entity.StudentExamAchievement;
import com.tutorschool.backend.exception.DuplicateResourceException;
import com.tutorschool.backend.exception.ExamInstitutionNotFoundException;
import com.tutorschool.backend.exception.ResourceInUseException;
import com.tutorschool.backend.mapper.ExamInstitutionMapper;
import com.tutorschool.backend.repository.ExamInstitutionRepository;
import com.tutorschool.backend.repository.StudentExamAchievementRepository;
import com.tutorschool.backend.service.ExamInstitutionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExamInstitutionServiceImpl implements ExamInstitutionService {

    private static final String CODE_PREFIX = "EXI-";

    private final ExamInstitutionRepository examInstitutionRepository;
    private final ExamInstitutionMapper examInstitutionMapper;
    private final StudentExamAchievementRepository studentExamAchievementRepository;

    @Override
    @Transactional
    public ExamInstitutionResponse createExamInstitution(ExamInstitutionRequest request) {
        String name = request.getInstitutionName().trim();
        if (examInstitutionRepository.existsByInstitutionNameIgnoreCase(name)) {
            throw new DuplicateResourceException("มีชื่อสถาบันนี้อยู่ในระบบแล้ว: " + name);
        }

        ExamInstitution institution = ExamInstitution.builder()
                .institutionCode(generateInstitutionCode())
                .institutionName(name)
                .institutionType(request.getInstitutionType())
                .province(request.getProvince())
                .district(request.getDistrict())
                .address(request.getAddress())
                .websiteUrl(request.getWebsiteUrl())
                .description(request.getDescription())
                .active(request.getActive() == null ? Boolean.TRUE : request.getActive())
                .build();

        ExamInstitution saved = examInstitutionRepository.save(institution);
        return examInstitutionMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamInstitutionResponse> getAllExamInstitutions() {
        return examInstitutionRepository.findAll().stream()
                .map(examInstitutionMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ExamInstitutionResponse getExamInstitutionById(Long id) {
        return examInstitutionMapper.toResponse(findEntityById(id));
    }

    @Override
    @Transactional
    public ExamInstitutionResponse updateExamInstitution(Long id, ExamInstitutionRequest request) {
        ExamInstitution institution = findEntityById(id);

        String newName = request.getInstitutionName().trim();
        if (!institution.getInstitutionName().equalsIgnoreCase(newName)
                && examInstitutionRepository.existsByInstitutionNameIgnoreCaseAndIdNot(newName, id)) {
            throw new DuplicateResourceException("มีชื่อสถาบันนี้อยู่ในระบบแล้ว: " + newName);
        }

        institution.setInstitutionName(newName);
        institution.setInstitutionType(request.getInstitutionType());
        institution.setProvince(request.getProvince());
        institution.setDistrict(request.getDistrict());
        institution.setAddress(request.getAddress());
        institution.setWebsiteUrl(request.getWebsiteUrl());
        institution.setDescription(request.getDescription());
        if (request.getActive() != null) {
            institution.setActive(request.getActive());
        }

        ExamInstitution saved = examInstitutionRepository.save(institution);
        return examInstitutionMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteExamInstitution(Long id) {
        ExamInstitution institution = findEntityById(id);
        if (studentExamAchievementRepository.existsByExamInstitutionId(id)) {
            throw new ResourceInUseException("ไม่สามารถลบข้อมูลได้เนื่องจากมีข้อมูลนักเรียนเชื่อมโยงอยู่");
        }
        institution.setActive(false);
        examInstitutionRepository.save(institution);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamInstitutionResponse> searchExamInstitutions(String keyword, InstitutionType type, Boolean active) {
        String normalizedKeyword = (keyword == null || keyword.isBlank()) ? null : keyword.trim();
        return examInstitutionRepository.searchExamInstitutions(normalizedKeyword, type, active).stream()
                .map(examInstitutionMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public InstitutionAchievementOverviewResponse getInstitutionAchievements(Long institutionId) {
        ExamInstitution institution = findEntityById(institutionId);

        List<StudentExamAchievement> achievements =
                studentExamAchievementRepository.findByExamInstitutionIdAndActiveTrue(institutionId);

        List<AchievementStudentCardResponse> lowerSecondary = new ArrayList<>();
        List<AchievementStudentCardResponse> upperSecondary = new ArrayList<>();
        List<AchievementStudentCardResponse> bachelor = new ArrayList<>();

        for (StudentExamAchievement a : achievements) {
            AchievementStudentCardResponse card = toAchievementCard(a);
            switch (a.getEducationLevel()) {
                case LOWER_SECONDARY -> lowerSecondary.add(card);
                case UPPER_SECONDARY -> upperSecondary.add(card);
                case BACHELOR -> bachelor.add(card);
                default -> { /* OTHER ไม่แสดงในกลุ่มใดกลุ่มหนึ่งของหน้ารายละเอียดสถาบัน แต่ยังนับรวมใน total */ }
            }
        }

        AchievementSummaryResponse summary = AchievementSummaryResponse.builder()
                .total(achievements.size())
                .lowerSecondaryCount(lowerSecondary.size())
                .upperSecondaryCount(upperSecondary.size())
                .bachelorCount(bachelor.size())
                .build();

        return InstitutionAchievementOverviewResponse.builder()
                .institution(examInstitutionMapper.toResponse(institution))
                .summary(summary)
                .lowerSecondary(lowerSecondary)
                .upperSecondary(upperSecondary)
                .bachelor(bachelor)
                .build();
    }

    private AchievementStudentCardResponse toAchievementCard(StudentExamAchievement a) {
        List<String> courseNames = a.getEnrollments().stream()
                .map(e -> e.getCourse().getCourseName())
                .toList();
        return AchievementStudentCardResponse.builder()
                .achievementId(a.getId())
                .studentId(a.getStudent().getId())
                .studentName(a.getStudent().getFullName())
                .academicYear(a.getAcademicYear())
                .schoolTrackName(a.getSchoolTrack() != null ? a.getSchoolTrack().getName() : null)
                .facultyName(a.getAcademicMajor() != null ? a.getAcademicMajor().getFaculty().getName() : null)
                .majorName(a.getAcademicMajor() != null ? a.getAcademicMajor().getName() : null)
                .admissionRoundName(a.getAdmissionRound() != null ? a.getAdmissionRound().getName() : null)
                .courseSummary("เรียน " + courseNames.size() + " คอร์ส")
                .courseNames(courseNames)
                .build();
    }

    private ExamInstitution findEntityById(Long id) {
        return examInstitutionRepository.findById(id)
                .orElseThrow(() -> new ExamInstitutionNotFoundException("ไม่พบข้อมูลสถาบันที่จัดสอบ รหัส: " + id));
    }

    private String generateInstitutionCode() {
        long sequence = examInstitutionRepository.count();
        String code;
        do {
            sequence++;
            code = CODE_PREFIX + String.format("%04d", sequence);
        } while (examInstitutionRepository.existsByInstitutionCode(code));
        return code;
    }
}
