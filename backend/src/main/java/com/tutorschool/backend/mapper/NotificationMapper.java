package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.NotificationResponse;
import com.tutorschool.backend.entity.Notification;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .notificationCode(notification.getNotificationCode())
                .userId(notification.getUser() != null ? notification.getUser().getId() : null)
                .recipientEmail(notification.getRecipientEmail())
                .subject(notification.getSubject())
                .message(notification.getMessage())
                .notificationType(notification.getNotificationType())
                .referenceType(notification.getReferenceType())
                .referenceId(notification.getReferenceId())
                .deliveryChannel(notification.getDeliveryChannel())
                .deliveryStatus(notification.getDeliveryStatus())
                .sentAt(notification.getSentAt())
                .failedReason(notification.getFailedReason())
                .createdAt(notification.getCreatedAt())
                .updatedAt(notification.getUpdatedAt())
                .build();
    }
}
