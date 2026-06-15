package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateInstitutionProfileRequest {

    @NotBlank(message = "Institution name must not be blank")
    private String institutionName;

    private String address;

    @NotBlank(message = "Phone number must not be blank")
    private String phoneNumber;

    @NotBlank(message = "Email must not be blank")
    @Email(message = "Email must be a valid email address")
    private String email;

    private String logoUrl;

    private String bankName;

    private String bankAccountName;

    private String bankAccountNumber;

    private String bankQrCode;
}
