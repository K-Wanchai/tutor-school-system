package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.SaveTestQuestionRequest;
import com.tutorschool.backend.dto.response.TestQuestionResponse;

import java.util.List;

public interface TestQuestionService {
    List<TestQuestionResponse> getQuestions(Long courseTestId);
    TestQuestionResponse saveQuestion(Long courseTestId, SaveTestQuestionRequest request);
    TestQuestionResponse updateQuestion(Long courseTestId, Long questionId, SaveTestQuestionRequest request);
    void deleteQuestion(Long courseTestId, Long questionId);
    List<TestQuestionResponse> saveAllQuestions(Long courseTestId, List<SaveTestQuestionRequest> questions);
}
