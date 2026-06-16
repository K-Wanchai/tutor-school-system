package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.CreateNotificationRequest;
import com.tutorschool.backend.dto.response.NotificationResponse;
import com.tutorschool.backend.entity.*;
import com.tutorschool.backend.exception.NotificationNotFoundException;
import com.tutorschool.backend.mapper.NotificationMapper;
import com.tutorschool.backend.repository.NotificationRepository;
import com.tutorschool.backend.repository.UserRepository;
import com.tutorschool.backend.service.EmailService;
import com.tutorschool.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final NotificationMapper notificationMapper;

    @Override
    @Transactional
    public NotificationResponse sendNotification(CreateNotificationRequest request) {
        User user = null;
        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId()).orElse(null);
        }

        Notification notification = Notification.builder()
                .user(user)
                .recipientEmail(request.getRecipientEmail())
                .subject(request.getSubject())
                .message(request.getMessage())
                .notificationType(request.getNotificationType())
                .referenceType(request.getReferenceType() != null ? request.getReferenceType() : ReferenceType.NONE)
                .referenceId(request.getReferenceId())
                .deliveryChannel(DeliveryChannel.EMAIL)
                .deliveryStatus(DeliveryStatus.PENDING)
                .build();

        notification = notificationRepository.save(notification);
        notification.setNotificationCode("NOTIF-" + String.format("%08d", notification.getId()));

        try {
            emailService.sendEmail(request.getRecipientEmail(), request.getSubject(), request.getMessage());
            notification.setDeliveryStatus(DeliveryStatus.SENT);
            notification.setSentAt(LocalDateTime.now());
        } catch (Exception e) {
            log.error("Notification #{} failed: {}", notification.getId(), e.getMessage());
            notification.setDeliveryStatus(DeliveryStatus.FAILED);
            notification.setFailedReason(e.getMessage());
        }

        notification = notificationRepository.save(notification);
        return notificationMapper.toResponse(notification);
    }

    @Override
    public List<NotificationResponse> getMyNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(notificationMapper::toResponse)
                .toList();
    }

    @Override
    public List<NotificationResponse> getAllNotifications() {
        return notificationRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(notificationMapper::toResponse)
                .toList();
    }

    @Override
    public NotificationResponse getNotificationById(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new NotificationNotFoundException("Notification not found with id: " + id));
        return notificationMapper.toResponse(notification);
    }

    @Override
    public List<NotificationResponse> getNotificationsByStatus(DeliveryStatus status) {
        return notificationRepository.findByDeliveryStatusOrderByCreatedAtDesc(status)
                .stream()
                .map(notificationMapper::toResponse)
                .toList();
    }

    @Override
    public void sendTestEmail(String recipientEmail, String subject, String message) {
        emailService.sendEmail(recipientEmail, subject, message);
    }

    @Override
    @Transactional
    public void deleteNotification(Long id) {
        if (!notificationRepository.existsById(id)) {
            throw new NotificationNotFoundException("Notification not found with id: " + id);
        }
        notificationRepository.deleteById(id);
    }
}
