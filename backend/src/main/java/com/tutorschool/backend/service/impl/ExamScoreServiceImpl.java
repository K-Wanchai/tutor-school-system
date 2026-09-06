package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.SaveExamScoreRequest;
import com.tutorschool.backend.dto.response.ExamManualScoreResponse;
import com.tutorschool.backend.entity.Exam;
import com.tutorschool.backend.entity.ExamManualScore;
import com.tutorschool.backend.entity.ExamStatus;
import com.tutorschool.backend.entity.Student;
import com.tutorschool.backend.entity.Tutor;
import com.tutorschool.backend.exception.ExamAccessDeniedException;
import com.tutorschool.backend.exception.ExamNotFoundException;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.repository.ExamManualScoreRepository;
import com.tutorschool.backend.repository.ExamRepository;
import com.tutorschool.backend.repository.StudentRepository;
import com.tutorschool.backend.repository.TutorRepository;
import com.tutorschool.backend.service.ExamScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExamScoreServiceImpl implements ExamScoreService {

    private final ExamManualScoreRepository manualScoreRepository;
    private final ExamRepository examRepository;
    private final StudentRepository studentRepository;
    private final TutorRepository tutorRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ExamManualScoreResponse> getCourseScores(Long courseId, String tutorEmail) {
        Tutor tutor = getTutor(tutorEmail);
        return manualScoreRepository.findByExamCourseId(courseId).stream()
                .filter(s -> s.getExam().getTutor().getId().equals(tutor.getId()))
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public ExamManualScoreResponse saveScore(SaveExamScoreRequest request, String tutorEmail) {
        Tutor tutor = getTutor(tutorEmail);

        Exam exam = examRepository.findById(request.getExamId())
                .orElseThrow(() -> new ExamNotFoundException(request.getExamId()));
        requireOwner(exam, tutor);
        requireExamStarted(exam);

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + request.getStudentId()));

        if (exam.getTotalScore() != null && request.getScore() > exam.getTotalScore()) {
            throw new IllegalArgumentException(
                    "คะแนนที่กรอก (" + request.getScore() + ") เกินคะแนนเต็มของการสอบ (" + exam.getTotalScore() + ")");
        }

        ExamManualScore score = manualScoreRepository
                .findByExamIdAndStudentId(exam.getId(), student.getId())
                .orElseGet(() -> ExamManualScore.builder().exam(exam).student(student).build());

        score.setScore(request.getScore());
        score.setNote(request.getNote() != null && !request.getNote().isBlank() ? request.getNote().trim() : null);
        score.setGradedBy(tutorEmail);

        return toResponse(manualScoreRepository.save(score));
    }

    @Override
    @Transactional
    public void deleteScore(Long examId, Long studentId, String tutorEmail) {
        Tutor tutor = getTutor(tutorEmail);
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ExamNotFoundException(examId));
        requireOwner(exam, tutor);
        manualScoreRepository.findByExamIdAndStudentId(examId, studentId)
                .ifPresent(manualScoreRepository::delete);
    }

    private Tutor getTutor(String tutorEmail) {
        return tutorRepository.findByUserEmail(tutorEmail)
                .orElseThrow(() -> new ExamAccessDeniedException("Current user is not registered as a Tutor"));
    }

    private void requireOwner(Exam exam, Tutor tutor) {
        if (!exam.getTutor().getId().equals(tutor.getId())) {
            throw new ExamAccessDeniedException("You do not have permission to grade this exam");
        }
    }

    // กรอกคะแนนได้ต่อเมื่อถึงกำหนดสอบแล้ว — ยังไม่เปิดสอบ (DRAFT) หรือเวลาเริ่มสอบยังไม่มาถึง = กรอกไม่ได้
    private void requireExamStarted(Exam exam) {
        boolean notStarted = exam.getStatus() == ExamStatus.DRAFT
                || (exam.getStartTime() != null && exam.getStartTime().isAfter(LocalDateTime.now()));
        if (notStarted) {
            throw new IllegalArgumentException("ยังกรอกคะแนนไม่ได้ เนื่องจากยังไม่ถึงกำหนดสอบ");
        }
    }

    private ExamManualScoreResponse toResponse(ExamManualScore score) {
        Student student = score.getStudent();
        return ExamManualScoreResponse.builder()
                .id(score.getId())
                .examId(score.getExam().getId())
                .studentId(student.getId())
                .studentName(student.getFullName())
                .studentCode(student.getStudentCode())
                .score(score.getScore())
                .note(score.getNote())
                .gradedBy(score.getGradedBy())
                .updatedAt(score.getUpdatedAt())
                .build();
    }
}
