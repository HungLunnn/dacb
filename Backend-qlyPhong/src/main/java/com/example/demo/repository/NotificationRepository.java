package com.example.demo.repository;

import com.example.demo.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, String> {
    Page<Notification> findAllByUser_UsernameOrderByCreatedAtDesc(String username, Pageable pageable);

    List<Notification> findAllByUser_IdAndIsReadFalse(String userId);

    Page<Notification> findAllByRecipientPhoneOrderByCreatedAtDesc(String recipientPhone, Pageable pageable);

    long countByRecipientPhoneAndIsReadFalse(String recipientPhone);

    long countByUser_IdAndIsReadFalse(String userId);

    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND (n.recipientPhone IS NULL OR n.recipientPhone = '') ORDER BY n.createdAt DESC")
    Page<Notification> findOwnWithoutPhone(@Param("userId") String userId, Pageable pageable);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.id = :userId AND n.isRead = false AND (n.recipientPhone IS NULL OR n.recipientPhone = '')")
    long countUnreadOwnWithoutPhone(@Param("userId") String userId);

    @Query("SELECT n FROM Notification n WHERE n.isRead = false AND n.user.id = :userId AND (n.recipientPhone IS NULL OR n.recipientPhone = '')")
    List<Notification> findUnreadOwnWithoutPhone(@Param("userId") String userId);

    @Query("SELECT n FROM Notification n WHERE n.recipientPhone = :phone OR (n.user.id = :userId AND (n.recipientPhone IS NULL OR n.recipientPhone = '')) ORDER BY n.createdAt DESC")
    Page<Notification> findByPhoneOrOwn(@Param("phone") String phone, @Param("userId") String userId, Pageable pageable);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.isRead = false AND (n.recipientPhone = :phone OR (n.user.id = :userId AND (n.recipientPhone IS NULL OR n.recipientPhone = '')))")
    long countUnreadByPhoneOrOwn(@Param("phone") String phone, @Param("userId") String userId);

    @Query("SELECT n FROM Notification n WHERE n.isRead = false AND (n.recipientPhone = :phone OR (n.user.id = :userId AND (n.recipientPhone IS NULL OR n.recipientPhone = '')))")
    List<Notification> findUnreadByPhoneOrOwn(@Param("phone") String phone, @Param("userId") String userId);
}
