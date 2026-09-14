package com.tutorschool.backend.dto.request;

import com.tutorschool.backend.entity.PaymentMethod;
import com.tutorschool.backend.entity.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePaymentRequest {

    private PaymentStatus paymentStatus;

    private PaymentMethod paymentMethod;

    private String note;
}
