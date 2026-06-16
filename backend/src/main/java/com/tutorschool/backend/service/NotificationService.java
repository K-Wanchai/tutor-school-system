package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.CreateNotificationRequest;
import com.tutorschool.backend.dto.response.NotificationResponse;
import com.tutorschool.backend.entity.DeliveryStatus;

import java.util.List;

public interface NotificationService {

    NotificationResponse sendNotification(CreateNotificationRequest request);

    List<NotificationResponse> getMyNotifications(Long userId);

    List<NotificationResponse> getAllNotifications();

    NotificationResponse getNotificationById(Long id);

    List<NotificationResponse> getNotificationsByStatus(DeliveryStatus status);

    void sendTestEmail(String recipientEmail, String subject, String message);

    void deleteNotification(Long id);
}
