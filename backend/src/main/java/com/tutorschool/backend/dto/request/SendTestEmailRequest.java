package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SendTestEmailRequest {

    @NotBlank(message = "recipientEmail is required")
    @Email(message = "recipientEmail must be a valid email address")
    private String recipientEmail;

    @NotBlank(message = "subject is required")
    private String subject;

    @NotBlank(message = "message is required")
    private String message;
}
