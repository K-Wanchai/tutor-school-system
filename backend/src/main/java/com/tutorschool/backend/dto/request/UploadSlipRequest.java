package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UploadSlipRequest {

    @NotBlank(message = "Payment slip URL is required")
    private String paymentSlipUrl;
}
