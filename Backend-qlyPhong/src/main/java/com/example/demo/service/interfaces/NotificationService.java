package com.example.demo.service.interfaces;

import com.example.demo.entity.Contract;
import com.example.demo.enumuration.ENotificationType;
import com.example.demo.model.DTO.notification.NotificationDTO;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface NotificationService {
    void notifyContractOrInvoiceEvent(Contract contract, String title, String message, ENotificationType type);

    Map<String, Object> getNotifications(String token, Pageable pageable);

    NotificationDTO markAsRead(String id, String token);

    Map<String, Object> markAllAsRead(String token);
}
