package com.example.demo.service.implement;

import com.example.demo.entity.Contract;
import com.example.demo.entity.Notification;
import com.example.demo.entity.User;
import com.example.demo.enumuration.ENotificationType;
import com.example.demo.enumuration.ERole;
import com.example.demo.exception.ForbiddenException;
import com.example.demo.exception.NotFoundException;
import com.example.demo.model.DTO.notification.NotificationDTO;
import com.example.demo.model.DTO.paging.APIPageableDTO;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.interfaces.NotificationService;
import com.example.demo.util.JwtUtil;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@AllArgsConstructor
public class NotificationServiceImpl implements NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    private String normalizePhone(String phone) {
        if (phone == null) return null;
        String trimmed = phone.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private NotificationDTO toDto(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType().name())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt() == null ? null : notification.getCreatedAt().toString())
                .recipientPhone(notification.getRecipientPhone())
                .build();
    }

    @Override
    @Transactional
    public void notifyContractOrInvoiceEvent(Contract contract, String title, String message, ENotificationType type) {
        if (contract == null) return;

        List<Notification> notificationsToSave = new ArrayList<>();
        String customerPhone = contract.getCustomer() == null ? null : normalizePhone(contract.getCustomer().getPhoneNumber());
        User targetUser = customerPhone != null
                ? userRepository.findFirstByPhoneNumber(customerPhone).orElse(contract.getUser())
                : contract.getUser();

        if (targetUser != null) {
            notificationsToSave.add(Notification.builder()
                    .user(targetUser)
                    .title(title)
                    .message(message)
                    .type(type)
                    .isRead(false)
                    .recipientPhone(customerPhone)
                    .build());
        }

        List<User> staffAndManagers = userRepository.findAllByRole_NameIn(List.of(ERole.MANAGER, ERole.STAFF));
        for (User admin : staffAndManagers) {
            String adminPhone = normalizePhone(admin.getPhoneNumber());
            if (customerPhone != null && customerPhone.equals(adminPhone)) {
                continue;
            }
            if (targetUser != null && admin.getId().equals(targetUser.getId()) && customerPhone == null) {
                continue;
            }
            notificationsToSave.add(Notification.builder()
                    .user(admin)
                    .title(title)
                    .message(message)
                    .type(type)
                    .isRead(false)
                    .recipientPhone(adminPhone)
                    .build());
        }

        if (!notificationsToSave.isEmpty()) {
            notificationRepository.saveAll(notificationsToSave);
        }
    }

    @Override
    public Map<String, Object> getNotifications(String token, Pageable pageable) {
        String username = JwtUtil.extractUsername(token);
        User currentUser = userRepository.findUserByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));
        String phoneNumber = normalizePhone(currentUser.getPhoneNumber());

        Page<Notification> notificationPage;
        long unreadCount;
        if (phoneNumber == null) {
            notificationPage = notificationRepository.findOwnWithoutPhone(currentUser.getId(), pageable);
            unreadCount = notificationRepository.countUnreadOwnWithoutPhone(currentUser.getId());
        } else {
            notificationPage = notificationRepository.findByPhoneOrOwn(phoneNumber, currentUser.getId(), pageable);
            unreadCount = notificationRepository.countUnreadByPhoneOrOwn(phoneNumber, currentUser.getId());
        }

        Page<NotificationDTO> dtoPage = notificationPage.map(this::toDto);
        Map<String, Object> result = new HashMap<>();
        result.put("page", new APIPageableDTO(dtoPage));
        result.put("notifications", dtoPage.getContent());
        result.put("unreadCount", unreadCount);
        return result;
    }

    @Override
    @Transactional
    public NotificationDTO markAsRead(String id, String token) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Notification not found"));

        String username = JwtUtil.extractUsername(token);
        User currentUser = userRepository.findUserByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));
        String phoneNumber = normalizePhone(currentUser.getPhoneNumber());
        String notifPhone = normalizePhone(notification.getRecipientPhone());

        boolean matchByPhone = phoneNumber != null && phoneNumber.equals(notifPhone);
        boolean matchOwnWithoutPhone = notification.getUser() != null
                && notification.getUser().getId().equals(currentUser.getId())
                && notifPhone == null;

        if (!matchByPhone && !matchOwnWithoutPhone) {
            throw new ForbiddenException();
        }

        if (!Boolean.TRUE.equals(notification.getIsRead())) {
            notification.setIsRead(true);
            notificationRepository.save(notification);
        }
        return toDto(notification);
    }

    @Override
    @Transactional
    public Map<String, Object> markAllAsRead(String token) {
        String username = JwtUtil.extractUsername(token);
        User currentUser = userRepository.findUserByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));
        String phoneNumber = normalizePhone(currentUser.getPhoneNumber());

        List<Notification> unread = phoneNumber == null
                ? notificationRepository.findUnreadOwnWithoutPhone(currentUser.getId())
                : notificationRepository.findUnreadByPhoneOrOwn(phoneNumber, currentUser.getId());

        for (Notification n : unread) {
            n.setIsRead(true);
        }
        if (!unread.isEmpty()) {
            notificationRepository.saveAll(unread);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("updatedCount", unread.size());
        return result;
    }
}
