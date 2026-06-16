package com.tutorschool.backend.dto.response;

import com.tutorschool.backend.entity.DeliveryChannel;
import com.tutorschool.backend.entity.DeliveryStatus;
import com.tutorschool.backend.entity.NotificationType;
import com.tutorschool.backend.entity.ReferenceType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class NotificationResponse {

    private Long id;
    private String notificationCode;

    private Long userId;
    private String recipientEmail;

    private String subject;
    private String message;

    private NotificationType notificationType;
    private ReferenceType referenceType;
    private Long referenceId;

    private DeliveryChannel deliveryChannel;
    private DeliveryStatus deliveryStatus;

    private LocalDateTime sentAt;
    private String failedReason;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
