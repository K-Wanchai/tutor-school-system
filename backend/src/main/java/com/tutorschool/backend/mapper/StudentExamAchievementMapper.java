package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.AchievementCourseTagResponse;
import com.tutorschool.backend.dto.response.StudentExamAchievementResponse;
import com.tutorschool.backend.entity.EducationLevel;
import com.tutorschool.backend.entity.StudentExamAchievement;
import org.springframework.stereotype.Component;

@Component
public class StudentExamAchievementMapper {

    public StudentExamAchievementResponse toResponse(StudentExamAchievement achievement) {
        return StudentExamAchievementResponse.builder()
                .id(achievement.getId())
                .studentId(achievement.getStudent().getId())
                .studentName(achievement.getStudent().getFullName())
                .studentCode(achievement.getStudent().getStudentCode())
                .studentEmail(achievement.getStudent().getUser() != null ? achievement.getStudent().getUser().getEmail() : null)
                .studentPhone(achievement.getStudent().getPhoneNumber())
                .examInstitutionId(achievement.getExamInstitution().getId())
                .institutionCode(achievement.getExamInstitution().getInstitutionCode())
                .institutionName(achievement.getExamInstitution().getInstitutionName())
                .institutionType(achievement.getExamInstitution().getInstitutionType())
                .educationLevel(achievement.getEducationLevel())
                .educationLevelLabel(toLabel(achievement.getEducationLevel()))
                .schoolTrackId(achievement.getSchoolTrack() != null ? achievement.getSchoolTrack().getId() : null)
                .schoolTrackName(achievement.getSchoolTrack() != null ? achievement.getSchoolTrack().getName() : null)
                .academicFacultyId(achievement.getAcademicMajor() != null ? achievement.getAcademicMajor().getFaculty().getId() : null)
                .facultyName(achievement.getAcademicMajor() != null ? achievement.getAcademicMajor().getFaculty().getName() : null)
                .academicMajorId(achievement.getAcademicMajor() != null ? achievement.getAcademicMajor().getId() : null)
                .majorName(achievement.getAcademicMajor() != null ? achievement.getAcademicMajor().getName() : null)
                .admissionRoundId(achievement.getAdmissionRound() != null ? achievement.getAdmissionRound().getId() : null)
                .admissionRoundName(achievement.getAdmissionRound() != null ? achievement.getAdmissionRound().getName() : null)
                .academicYear(achievement.getAcademicYear())
                .resultDate(achievement.getResultDate())
                .note(achievement.getNote())
                .active(achievement.getActive())
                .taggedCourses(achievement.getEnrollments().stream()
                        .map(e -> AchievementCourseTagResponse.builder()
                                .enrollmentId(e.getId())
                                .courseId(e.getCourse().getId())
                                .courseCode(e.getCourse().getCourseCode())
                                .courseName(e.getCourse().getCourseName())
                                .build())
                        .toList())
                .createdAt(achievement.getCreatedAt())
                .updatedAt(achievement.getUpdatedAt())
                .build();
    }

    public static String toLabel(EducationLevel level) {
        if (level == null) {
            return "-";
        }
        return switch (level) {
            case LOWER_SECONDARY -> "มัธยมต้น";
            case UPPER_SECONDARY -> "มัธยมปลาย";
            case BACHELOR -> "ปริญญาตรี / มหาวิทยาลัย";
            case OTHER -> "อื่น ๆ";
        };
    }
}
