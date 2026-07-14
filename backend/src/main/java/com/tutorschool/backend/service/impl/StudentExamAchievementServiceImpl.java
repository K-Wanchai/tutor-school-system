package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.StudentExamAchievementRequest;
import com.tutorschool.backend.dto.response.CourseLessonSummaryResponse;
import com.tutorschool.backend.dto.response.StudentAchievementDetailResponse;
import com.tutorschool.backend.dto.response.StudentCourseDetailResponse;
import com.tutorschool.backend.dto.response.StudentExamAchievementResponse;
import com.tutorschool.backend.dto.response.TutorSummaryResponse;
import com.tutorschool.backend.entity.AcademicMajor;
import com.tutorschool.backend.entity.AdmissionRound;
import com.tutorschool.backend.entity.Course;
import com.tutorschool.backend.entity.EducationLevel;
import com.tutorschool.backend.entity.Enrollment;
import com.tutorschool.backend.entity.ExamInstitution;
import com.tutorschool.backend.entity.SchoolTrack;
import com.tutorschool.backend.entity.Student;
import com.tutorschool.backend.entity.StudentExamAchievement;
import com.tutorschool.backend.entity.Tutor;
import com.tutorschool.backend.exception.DuplicateAchievementException;
import com.tutorschool.backend.exception.ExamInstitutionNotFoundException;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.exception.StudentAchievementNotFoundException;
import com.tutorschool.backend.mapper.StudentExamAchievementMapper;
import com.tutorschool.backend.repository.AcademicMajorRepository;
import com.tutorschool.backend.repository.AdmissionRoundRepository;
import com.tutorschool.backend.repository.EnrollmentRepository;
import com.tutorschool.backend.repository.ExamInstitutionRepository;
import com.tutorschool.backend.repository.SchoolTrackRepository;
import com.tutorschool.backend.repository.StudentExamAchievementRepository;
import com.tutorschool.backend.repository.StudentRepository;
import com.tutorschool.backend.service.StudentExamAchievementService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentExamAchievementServiceImpl implements StudentExamAchievementService {

    private final StudentExamAchievementRepository achievementRepository;
    private final StudentRepository studentRepository;
    private final ExamInstitutionRepository examInstitutionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final SchoolTrackRepository schoolTrackRepository;
    private final AcademicMajorRepository academicMajorRepository;
    private final AdmissionRoundRepository admissionRoundRepository;
    private final StudentExamAchievementMapper achievementMapper;

    @Override
    @Transactional
    public StudentExamAchievementResponse createAchievement(StudentExamAchievementRequest request) {
        Student student = findStudent(request.getStudentId());
        ExamInstitution institution = findInstitution(request.getExamInstitutionId());
        validateLevelDetails(request);

        if (achievementRepository.existsByStudentIdAndExamInstitutionIdAndEducationLevelAndAcademicYearAndActiveTrue(
                request.getStudentId(), request.getExamInstitutionId(), request.getEducationLevel(), request.getAcademicYear())) {
            throw new DuplicateAchievementException(
                    "มีบันทึกผลสอบติดของนักเรียนคนนี้ ที่สถาบัน ระดับ และปีการศึกษาเดียวกันอยู่แล้ว");
        }

        StudentExamAchievement achievement = StudentExamAchievement.builder()
                .student(student)
                .examInstitution(institution)
                .enrollments(resolveStudentEnrollments(request.getEnrollmentIds(), student))
                .educationLevel(request.getEducationLevel())
                .schoolTrack(resolveSchoolTrack(request.getSchoolTrackId(), institution.getId()))
                .academicMajor(resolveAcademicMajor(request.getAcademicMajorId(), institution.getId()))
                .admissionRound(resolveAdmissionRound(request.getAdmissionRoundId(), institution.getId()))
                .academicYear(request.getAcademicYear())
                .resultDate(request.getResultDate())
                .note(request.getNote())
                .active(request.getActive() == null ? Boolean.TRUE : request.getActive())
                .build();

        StudentExamAchievement saved = achievementRepository.save(achievement);
        return achievementMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentExamAchievementResponse> getAllAchievements() {
        return achievementRepository.findAll().stream()
                .map(achievementMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public StudentExamAchievementResponse getAchievementById(Long id) {
        return achievementMapper.toResponse(findEntityById(id));
    }

    @Override
    @Transactional
    public StudentExamAchievementResponse updateAchievement(Long id, StudentExamAchievementRequest request) {
        StudentExamAchievement achievement = findEntityById(id);
        Student student = findStudent(request.getStudentId());
        ExamInstitution institution = findInstitution(request.getExamInstitutionId());
        validateLevelDetails(request);

        boolean keyChanged = !achievement.getStudent().getId().equals(request.getStudentId())
                || !achievement.getExamInstitution().getId().equals(request.getExamInstitutionId())
                || achievement.getEducationLevel() != request.getEducationLevel()
                || !achievement.getAcademicYear().equals(request.getAcademicYear());

        if (keyChanged && achievementRepository.existsByStudentIdAndExamInstitutionIdAndEducationLevelAndAcademicYearAndActiveTrueAndIdNot(
                request.getStudentId(), request.getExamInstitutionId(), request.getEducationLevel(), request.getAcademicYear(), id)) {
            throw new DuplicateAchievementException(
                    "มีบันทึกผลสอบติดของนักเรียนคนนี้ ที่สถาบัน ระดับ และปีการศึกษาเดียวกันอยู่แล้ว");
        }

        achievement.setStudent(student);
        achievement.setExamInstitution(institution);
        achievement.setEnrollments(resolveStudentEnrollments(request.getEnrollmentIds(), student));
        achievement.setEducationLevel(request.getEducationLevel());
        achievement.setSchoolTrack(resolveSchoolTrack(request.getSchoolTrackId(), institution.getId()));
        achievement.setAcademicMajor(resolveAcademicMajor(request.getAcademicMajorId(), institution.getId()));
        achievement.setAdmissionRound(resolveAdmissionRound(request.getAdmissionRoundId(), institution.getId()));
        achievement.setAcademicYear(request.getAcademicYear());
        achievement.setResultDate(request.getResultDate());
        achievement.setNote(request.getNote());
        if (request.getActive() != null) {
            achievement.setActive(request.getActive());
        }

        StudentExamAchievement saved = achievementRepository.save(achievement);
        return achievementMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteAchievement(Long id) {
        StudentExamAchievement achievement = findEntityById(id);
        achievement.setActive(false);
        achievementRepository.save(achievement);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentExamAchievementResponse> getAchievementsByStudent(Long studentId) {
        findStudent(studentId);
        return achievementRepository.findByStudentId(studentId).stream()
                .map(achievementMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentExamAchievementResponse> searchAchievements(
            String keyword, EducationLevel educationLevel, Long institutionId, Integer academicYear, Boolean active) {
        String normalizedKeyword = (keyword == null || keyword.isBlank()) ? null : keyword.trim();
        return achievementRepository
                .searchAchievements(normalizedKeyword, educationLevel, institutionId, academicYear, active)
                .stream()
                .map(achievementMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public StudentAchievementDetailResponse getStudentAchievementDetail(Long achievementId) {
        StudentExamAchievement achievement = findEntityById(achievementId);

        List<StudentCourseDetailResponse> enrollments = achievement.getEnrollments().stream()
                .map(this::toCourseDetail)
                .toList();

        return StudentAchievementDetailResponse.builder()
                .achievement(achievementMapper.toResponse(achievement))
                .enrollments(enrollments)
                .build();
    }

    private StudentCourseDetailResponse toCourseDetail(Enrollment enrollment) {
        Course course = enrollment.getCourse();
        Tutor tutor = course.getTutor();

        List<CourseLessonSummaryResponse> lessons = course.getLessons().stream()
                .map(lesson -> CourseLessonSummaryResponse.builder()
                        .lessonId(lesson.getId())
                        .lessonTitle(lesson.getLessonTitle())
                        .lessonDescription(lesson.getLessonContent())
                        .lessonOrder(lesson.getLessonOrder())
                        .build())
                .toList();

        TutorSummaryResponse tutorSummary = tutor == null ? null : TutorSummaryResponse.builder()
                .tutorId(tutor.getId())
                .tutorName(tutor.getFirstName() + " " + tutor.getLastName())
                .build();

        return StudentCourseDetailResponse.builder()
                .enrollmentId(enrollment.getId())
                .courseId(course.getId())
                .courseCode(course.getCourseCode())
                .courseName(course.getCourseName())
                .enrollmentStatus(enrollment.getStatus())
                .enrolledAt(enrollment.getEnrollmentDate())
                .tutor(tutorSummary)
                .lessons(lessons)
                .build();
    }

    private List<Enrollment> resolveStudentEnrollments(List<Long> enrollmentIds, Student student) {
        if (enrollmentIds == null || enrollmentIds.isEmpty()) {
            return List.of();
        }

        List<Enrollment> enrollments = enrollmentRepository.findAllById(enrollmentIds);
        if (enrollments.size() != enrollmentIds.size()) {
            throw new IllegalArgumentException("ไม่พบข้อมูลคอร์สที่เลือกบางรายการในระบบ");
        }

        boolean allBelongToStudent = enrollments.stream()
                .allMatch(e -> e.getStudent().getId().equals(student.getId()));
        if (!allBelongToStudent) {
            throw new IllegalArgumentException("คอร์สที่เลือกต้องเป็นคอร์สที่นักเรียนคนนี้ลงทะเบียนแล้วเท่านั้น");
        }

        return enrollments;
    }

    private void validateLevelDetails(StudentExamAchievementRequest request) {
        EducationLevel level = request.getEducationLevel();
        if ((level == EducationLevel.LOWER_SECONDARY || level == EducationLevel.UPPER_SECONDARY)
                && request.getSchoolTrackId() == null) {
            throw new IllegalArgumentException("กรุณาเลือกสายการเรียน/ห้องเรียนสำหรับระดับมัธยมต้น/มัธยมปลาย");
        }
        if (level == EducationLevel.BACHELOR && request.getAcademicMajorId() == null) {
            throw new IllegalArgumentException("กรุณาเลือกสาขาสำหรับระดับมหาวิทยาลัย");
        }
    }

    private SchoolTrack resolveSchoolTrack(Long schoolTrackId, Long institutionId) {
        if (schoolTrackId == null) {
            return null;
        }
        SchoolTrack track = schoolTrackRepository.findById(schoolTrackId)
                .orElseThrow(() -> new ResourceNotFoundException("ไม่พบข้อมูลสายการเรียน/ห้องเรียน รหัส: " + schoolTrackId));
        if (!track.getExamInstitution().getId().equals(institutionId)) {
            throw new IllegalArgumentException("สายการเรียน/ห้องเรียนที่เลือกไม่ได้อยู่ในสถาบันนี้");
        }
        return track;
    }

    private AcademicMajor resolveAcademicMajor(Long academicMajorId, Long institutionId) {
        if (academicMajorId == null) {
            return null;
        }
        AcademicMajor major = academicMajorRepository.findById(academicMajorId)
                .orElseThrow(() -> new ResourceNotFoundException("ไม่พบข้อมูลสาขา รหัส: " + academicMajorId));
        if (!major.getFaculty().getExamInstitution().getId().equals(institutionId)) {
            throw new IllegalArgumentException("สาขาที่เลือกไม่ได้อยู่ในสถาบันนี้");
        }
        return major;
    }

    private AdmissionRound resolveAdmissionRound(Long admissionRoundId, Long institutionId) {
        if (admissionRoundId == null) {
            return null;
        }
        AdmissionRound round = admissionRoundRepository.findById(admissionRoundId)
                .orElseThrow(() -> new ResourceNotFoundException("ไม่พบข้อมูลรอบที่สอบติด รหัส: " + admissionRoundId));
        if (!round.getExamInstitution().getId().equals(institutionId)) {
            throw new IllegalArgumentException("รอบที่สอบติดที่เลือกไม่ได้อยู่ในสถาบันนี้");
        }
        return round;
    }

    private StudentExamAchievement findEntityById(Long id) {
        return achievementRepository.findById(id)
                .orElseThrow(() -> new StudentAchievementNotFoundException("ไม่พบข้อมูลผลการสอบติด รหัส: " + id));
    }

    private Student findStudent(Long studentId) {
        return studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
    }

    private ExamInstitution findInstitution(Long institutionId) {
        return examInstitutionRepository.findById(institutionId)
                .orElseThrow(() -> new ExamInstitutionNotFoundException("ไม่พบข้อมูลสถาบันที่จัดสอบ รหัส: " + institutionId));
    }
}
