package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.exception.EmailSendFailedException;
import com.tutorschool.backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Override
    public void sendEmail(String recipientEmail, String subject, String message) {
        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(recipientEmail);
            mail.setSubject(subject);
            mail.setText(message);
            mailSender.send(mail);
            log.info("Email sent to: {}", recipientEmail);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", recipientEmail, e.getMessage());
            throw new EmailSendFailedException("Failed to send email to " + recipientEmail + ": " + e.getMessage(), e);
        }
    }

    @Override
    public String buildCourseScheduleCreatedEmail(String courseName, String scheduleDate,
                                                   String startTime, String endTime,
                                                   String location, String meetingLink,
                                                   String scheduleType) {
        StringBuilder sb = new StringBuilder();
        sb.append("เรียนคุณนักเรียน,\n\n");
        sb.append("มีตารางเรียนใหม่สำหรับคอร์ส: ").append(courseName).append("\n\n");
        sb.append("รายละเอียด:\n");
        sb.append("วันที่: ").append(scheduleDate).append("\n");
        sb.append("เวลา: ").append(startTime).append(" - ").append(endTime).append("\n");
        sb.append("รูปแบบ: ").append(scheduleType).append("\n");
        if (location != null && !location.isBlank()) {
            sb.append("สถานที่: ").append(location).append("\n");
        }
        if (meetingLink != null && !meetingLink.isBlank()) {
            sb.append("ลิงก์เรียนออนไลน์: ").append(meetingLink).append("\n");
        }
        sb.append("\nกรุณาตรวจสอบตารางเรียนของคุณในระบบ\n\n");
        sb.append("ขอแสดงความนับถือ\nTutor School System");
        return sb.toString();
    }

    @Override
    public String buildClassCancelledEmail(String courseName, String scheduleDate,
                                            String startTime, String endTime,
                                            String cancelReason) {
        return "เรียนคุณนักเรียน,\n\n" +
                "คลาสเรียน " + courseName + " วันที่ " + scheduleDate +
                " เวลา " + startTime + "-" + endTime + " ถูกยกเลิก\n\n" +
                "เหตุผล:\n" + cancelReason + "\n\n" +
                "กรุณาตรวจสอบตารางเรียนของคุณในระบบ\n\n" +
                "ขอแสดงความนับถือ\nTutor School System";
    }

    @Override
    public String buildPaymentVerifiedEmail(String studentName, String courseName,
                                             String amount, String enrollmentCode) {
        return "เรียนคุณ " + studentName + ",\n\n" +
                "การชำระเงินสำหรับคอร์ส " + courseName + " ได้รับการยืนยันแล้ว\n\n" +
                "รายละเอียด:\n" +
                "รหัสการลงทะเบียน: " + enrollmentCode + "\n" +
                "คอร์ส: " + courseName + "\n" +
                "จำนวนเงิน: " + amount + " บาท\n\n" +
                "คุณสามารถเข้าเรียนได้ทันทีในระบบ\n\n" +
                "ขอแสดงความนับถือ\nTutor School System";
    }

    @Override
    public String buildPaymentRejectedEmail(String studentName, String courseName,
                                             String reason) {
        return "เรียนคุณ " + studentName + ",\n\n" +
                "การชำระเงินสำหรับคอร์ส " + courseName + " ถูกปฏิเสธ\n\n" +
                "เหตุผล: " + reason + "\n\n" +
                "กรุณาติดต่อเจ้าหน้าที่หรือชำระเงินใหม่อีกครั้ง\n\n" +
                "ขอแสดงความนับถือ\nTutor School System";
    }

    @Override
    public String buildExamOpenedEmail(String studentName, String examTitle,
                                        String courseName, String dueDate) {
        return "เรียนคุณ " + studentName + ",\n\n" +
                "ข้อสอบ \"" + examTitle + "\" ในคอร์ส " + courseName + " เปิดให้ทำแล้ว\n\n" +
                "กำหนดส่ง: " + dueDate + "\n\n" +
                "กรุณาเข้าสู่ระบบเพื่อทำข้อสอบ\n\n" +
                "ขอแสดงความนับถือ\nTutor School System";
    }

    @Override
    public String buildExamResultReleasedEmail(String studentName, String examTitle,
                                                String score, String maxScore) {
        return "เรียนคุณ " + studentName + ",\n\n" +
                "ผลสอบ \"" + examTitle + "\" ได้รับการประกาศแล้ว\n\n" +
                "คะแนนของคุณ: " + score + " / " + maxScore + "\n\n" +
                "กรุณาเข้าสู่ระบบเพื่อดูผลสอบโดยละเอียด\n\n" +
                "ขอแสดงความนับถือ\nTutor School System";
    }

    @Override
    public String buildPasswordChangedEmail(String userName) {
        return "เรียนคุณ " + userName + ",\n\n" +
                "รหัสผ่านของคุณถูกเปลี่ยนแล้ว\n\n" +
                "หากคุณไม่ได้เป็นผู้ดำเนินการ กรุณาติดต่อผู้ดูแลระบบทันที\n\n" +
                "ขอแสดงความนับถือ\nTutor School System";
    }
}
