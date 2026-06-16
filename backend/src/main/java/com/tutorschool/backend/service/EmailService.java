package com.tutorschool.backend.service;

public interface EmailService {

    void sendEmail(String recipientEmail, String subject, String message);

    String buildCourseScheduleCreatedEmail(String courseName, String scheduleDate,
                                           String startTime, String endTime,
                                           String location, String meetingLink,
                                           String scheduleType);

    String buildClassCancelledEmail(String courseName, String scheduleDate,
                                    String startTime, String endTime,
                                    String cancelReason);

    String buildPaymentVerifiedEmail(String studentName, String courseName,
                                     String amount, String enrollmentCode);

    String buildPaymentRejectedEmail(String studentName, String courseName,
                                     String reason);

    String buildExamOpenedEmail(String studentName, String examTitle,
                                String courseName, String dueDate);

    String buildExamResultReleasedEmail(String studentName, String examTitle,
                                        String score, String maxScore);

    String buildPasswordChangedEmail(String userName);
}
