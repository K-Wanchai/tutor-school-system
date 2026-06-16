package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.CreatePaymentRequest;
import com.tutorschool.backend.dto.request.RejectPaymentRequest;
import com.tutorschool.backend.dto.request.VerifyPaymentRequest;
import com.tutorschool.backend.dto.response.PaymentResponse;

import java.util.List;

public interface PaymentService {

    PaymentResponse createPayment(CreatePaymentRequest request);

    List<PaymentResponse> getAllPayments();

    PaymentResponse getPaymentById(Long id);

    PaymentResponse getPaymentByCode(String paymentCode);

    List<PaymentResponse> getPaymentsByEnrollmentId(Long enrollmentId);

    List<PaymentResponse> getPaymentsByStudentId(Long studentId);

    PaymentResponse verifyPayment(Long id, VerifyPaymentRequest request);

    PaymentResponse rejectPayment(Long id, RejectPaymentRequest request);

    void deletePayment(Long id);
}
