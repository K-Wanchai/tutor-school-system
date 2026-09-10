package com.tutorschool.backend.entity;

public enum Role {
    ADMIN,
    TUTOR,
    STUDENT,
    // ผู้ปกครองของนักเรียน — เข้าระบบด้วยเลขบัตรประชาชนของนักเรียน ดูได้เฉพาะข้อมูลการเข้าเรียนของบุตรหลาน
    PARENT
}
