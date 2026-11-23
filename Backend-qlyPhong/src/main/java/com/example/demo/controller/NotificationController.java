package com.example.demo.controller;

import com.example.demo.response.ApiResponse;
import com.example.demo.service.interfaces.NotificationService;
import com.example.demo.util.JwtUtil;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/notifications")
@AllArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<Object> getNotifications(@RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "10") int pageSize,
                                                   HttpServletRequest request) {
        String token = JwtUtil.getTokenFromRequest(request);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.unsorted());
        return ApiResponse.responseBuilder(HttpStatus.OK, "Success", notificationService.getNotifications(token, pageable));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Object> markAsRead(@PathVariable String id, HttpServletRequest request) {
        String token = JwtUtil.getTokenFromRequest(request);
        return ApiResponse.responseBuilder(HttpStatus.OK, "Success", notificationService.markAsRead(id, token));
    }

    @PostMapping("/read-all")
    public ResponseEntity<Object> markAllAsRead(HttpServletRequest request) {
        String token = JwtUtil.getTokenFromRequest(request);
        return ApiResponse.responseBuilder(HttpStatus.OK, "Success", notificationService.markAllAsRead(token));
    }
}
