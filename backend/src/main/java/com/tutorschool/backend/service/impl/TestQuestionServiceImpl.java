package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.SaveTestQuestionRequest;
import com.tutorschool.backend.dto.response.TestQuestionOptionResponse;
import com.tutorschool.backend.dto.response.TestQuestionResponse;
import com.tutorschool.backend.entity.CourseTest;
import com.tutorschool.backend.entity.TestQuestion;
import com.tutorschool.backend.entity.TestQuestionOption;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.repository.CourseTestRepository;
import com.tutorschool.backend.repository.TestQuestionRepository;
import com.tutorschool.backend.service.TestQuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class TestQuestionServiceImpl implements TestQuestionService {

    private final TestQuestionRepository questionRepository;
    private final CourseTestRepository courseTestRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TestQuestionResponse> getQuestions(Long courseTestId) {
        if (!courseTestRepository.existsById(courseTestId)) {
            throw new ResourceNotFoundException("CourseTest", courseTestId);
        }
        return questionRepository.findByCourseTestIdOrderByQuestionOrderAsc(courseTestId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public TestQuestionResponse saveQuestion(Long courseTestId, SaveTestQuestionRequest request) {
        CourseTest courseTest = courseTestRepository.findById(courseTestId)
                .orElseThrow(() -> new ResourceNotFoundException("CourseTest", courseTestId));

        int nextOrder = questionRepository.countByCourseTestId(courseTestId) + 1;

        TestQuestion question = TestQuestion.builder()
                .courseTest(courseTest)
                .questionText(request.getQuestionText())
                .questionType(request.getQuestionType())
                .questionOrder(request.getQuestionOrder() != null ? request.getQuestionOrder() : nextOrder)
                .explanation(request.getExplanation())
                .build();

        addOptions(question, request);
        return toResponse(questionRepository.save(question));
    }

    @Override
    @Transactional
    public TestQuestionResponse updateQuestion(Long courseTestId, Long questionId, SaveTestQuestionRequest request) {
        TestQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("TestQuestion", questionId));
        if (!question.getCourseTest().getId().equals(courseTestId)) {
            throw new IllegalStateException("Question does not belong to this test");
        }

        question.setQuestionText(request.getQuestionText());
        question.setQuestionType(request.getQuestionType());
        question.setExplanation(request.getExplanation());
        if (request.getQuestionOrder() != null) question.setQuestionOrder(request.getQuestionOrder());

        question.getOptions().clear();
        addOptions(question, request);

        return toResponse(questionRepository.save(question));
    }

    @Override
    @Transactional
    public void deleteQuestion(Long courseTestId, Long questionId) {
        TestQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("TestQuestion", questionId));
        if (!question.getCourseTest().getId().equals(courseTestId)) {
            throw new IllegalStateException("Question does not belong to this test");
        }
        questionRepository.delete(question);
    }

    @Override
    @Transactional
    public List<TestQuestionResponse> saveAllQuestions(Long courseTestId, List<SaveTestQuestionRequest> requests) {
        CourseTest courseTest = courseTestRepository.findById(courseTestId)
                .orElseThrow(() -> new ResourceNotFoundException("CourseTest", courseTestId));

        // replace all existing questions
        courseTest.getQuestions().clear();
        questionRepository.flush();

        List<TestQuestionResponse> results = new ArrayList<>();
        AtomicInteger order = new AtomicInteger(1);

        for (SaveTestQuestionRequest req : requests) {
            TestQuestion q = TestQuestion.builder()
                    .courseTest(courseTest)
                    .questionText(req.getQuestionText())
                    .questionType(req.getQuestionType())
                    .questionOrder(order.getAndIncrement())
                    .explanation(req.getExplanation())
                    .build();
            addOptions(q, req);
            courseTest.getQuestions().add(q);
        }

        courseTestRepository.save(courseTest);
        courseTestRepository.flush();

        return questionRepository.findByCourseTestIdOrderByQuestionOrderAsc(courseTestId)
                .stream().map(this::toResponse).toList();
    }

    // ── helpers ──────────────────────────────────────────────────────────────────

    private void addOptions(TestQuestion question, SaveTestQuestionRequest request) {
        if (request.getOptions() == null) return;
        int order = 1;
        for (var opt : request.getOptions()) {
            TestQuestionOption option = TestQuestionOption.builder()
                    .question(question)
                    .optionText(opt.getOptionText())
                    .correct(opt.isCorrect())
                    .optionOrder(opt.getOptionOrder() != null ? opt.getOptionOrder() : order)
                    .build();
            question.getOptions().add(option);
            order++;
        }
    }

    private TestQuestionResponse toResponse(TestQuestion q) {
        return TestQuestionResponse.builder()
                .id(q.getId())
                .courseTestId(q.getCourseTest().getId())
                .questionText(q.getQuestionText())
                .questionType(q.getQuestionType())
                .questionOrder(q.getQuestionOrder())
                .explanation(q.getExplanation())
                .options(q.getOptions().stream().map(o -> TestQuestionOptionResponse.builder()
                        .id(o.getId())
                        .optionText(o.getOptionText())
                        .correct(o.isCorrect())
                        .optionOrder(o.getOptionOrder())
                        .build()).toList())
                .createdAt(q.getCreatedAt())
                .updatedAt(q.getUpdatedAt())
                .build();
    }
}
