package com.tutorschool.backend.dto.request;

import com.tutorschool.backend.entity.NotificationType;
import com.tutorschool.backend.entity.ReferenceType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateNotificationRequest {

    private Long userId;

    @NotBlank(message = "recipientEmail is required")
    @Email(message = "recipientEmail must be a valid email address")
    private String recipientEmail;

    @NotBlank(message = "subject is required")
    private String subject;

    @NotBlank(message = "message is required")
    private String message;

    @NotNull(message = "notificationType is required")
    private NotificationType notificationType;

    private ReferenceType referenceType = ReferenceType.NONE;

    private Long referenceId;
}
