package com.example.demo.model.DTO.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private String id;
    private String title;
    private String message;
    private String type;
    private Boolean isRead;
    private String createdAt;
    private String recipientPhone;
}
