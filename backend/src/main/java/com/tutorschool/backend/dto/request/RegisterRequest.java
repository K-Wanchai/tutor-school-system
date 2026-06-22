package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "กรุณากรอกชื่อ")
    @Size(max = 100, message = "ชื่อต้องไม่เกิน 100 ตัวอักษร")
    private String firstName;

    @NotBlank(message = "กรุณากรอกนามสกุล")
    @Size(max = 100, message = "นามสกุลต้องไม่เกิน 100 ตัวอักษร")
    private String lastName;

    @NotBlank(message = "กรุณากรอกชื่อผู้ใช้")
    @Size(max = 100, message = "ชื่อผู้ใช้ต้องไม่เกิน 100 ตัวอักษร")
    private String username;

    @NotBlank(message = "กรุณากรอกอีเมล")
    @Email(message = "รูปแบบอีเมลไม่ถูกต้อง")
    private String email;

    @NotBlank(message = "กรุณากรอกรหัสผ่าน")
    @Size(min = 8, message = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
    private String password;

    @NotBlank(message = "กรุณากรอกเลขบัตรประชาชน")
    @Pattern(regexp = "\\d{13}", message = "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก")
    private String nationalId;

    private LocalDate birthDate;

    @NotBlank(message = "กรุณากรอกเบอร์โทรศัพท์")
    @Pattern(regexp = "^[0-9]{10}$", message = "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก")
    private String phone;

    @NotBlank(message = "กรุณากรอกที่อยู่")
    private String address;

    @NotBlank(message = "กรุณากรอกเบอร์โทรผู้ปกครอง")
    private String parentPhone;

    @NotBlank(message = "กรุณากรอกชื่อธนาคาร")
    private String bankName;

    @NotBlank(message = "กรุณากรอกชื่อบัญชี")
    private String accountName;

    @NotBlank(message = "กรุณากรอกเลขบัญชี")
    private String accountNumber;
}
