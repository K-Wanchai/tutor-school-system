package com.tutorschool.backend.scheduler;

import com.tutorschool.backend.service.ExamService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExamScheduler {

    private final ExamService examService;

    @Scheduled(fixedDelay = 60000)
    public void runAutoTransition() {
        try {
            examService.autoTransitionExams();
        } catch (Exception e) {
            log.error("Exam auto-transition run failed: {}", e.getMessage(), e);
        }
    }
}
