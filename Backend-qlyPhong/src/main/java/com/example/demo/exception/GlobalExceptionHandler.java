package com.example.demo.exception;

import com.example.demo.response.ErrorResponse;
import io.jsonwebtoken.JwtException;
import lombok.extern.log4j.Log4j2;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.format.DateTimeParseException;

@Log4j2
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(NotFoundException.class)
    public ErrorResponse handlerNotFoundException(NotFoundException e) {
        return new ErrorResponse(e.getHttpStatus().value(), e.getMessage());
    }

    @ExceptionHandler(InValidException.class)
    public ErrorResponse handlerNotValidException(InValidException e) {
        return new ErrorResponse(e.getHttpStatus().value(), e.getMessage());
    }

    @ExceptionHandler(ForbiddenException.class)
    public ErrorResponse handlerForbiddenException(ForbiddenException e) {
        return new ErrorResponse(e.getHttpStatus().value(), e.getMessage());
    }

    @ExceptionHandler(NotNullException.class)
    public ErrorResponse handlerNotNullException(NotNullException e) {
        return new ErrorResponse(e.getHttpStatus().value(), e.getMessage());
    }

    @ExceptionHandler(NoContentException.class)
    public ErrorResponse handlerNoContentException(NoContentException e) {
        return new ErrorResponse(e.getHttpStatus().value(), e.getMessage());
    }

    @ExceptionHandler(DuplicatedException.class)
    public ErrorResponse handlerDuplicatedException(DuplicatedException e) {
        return new ErrorResponse(e.getHttpStatus().value(), e.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ErrorResponse handlerAccessDeniedException(AccessDeniedException e) {
        return new ErrorResponse(HttpStatus.FORBIDDEN.value(), "Bạn không có quyền thực hiện thao tác này");
    }

    @ExceptionHandler(JwtException.class)
    public ErrorResponse handlerJwtException(JwtException e) {
        return new ErrorResponse(HttpStatus.UNAUTHORIZED.value(), e.getMessage());
    }

    @ExceptionHandler(DateTimeParseException.class)
    public ErrorResponse handlerDateTimeParseException(DateTimeParseException e) {
        return new ErrorResponse(HttpStatus.BAD_REQUEST.value(), "Định dạng ngày không hợp lệ (cần yyyy-MM-dd)");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ErrorResponse handlerDataIntegrityViolation(DataIntegrityViolationException e) {
        return new ErrorResponse(HttpStatus.CONFLICT.value(), "Dữ liệu bị trùng lặp hoặc vi phạm ràng buộc cơ sở dữ liệu");
    }

    // Exception hệ thống
    @ExceptionHandler(Exception.class)
    public ErrorResponse handlerException(Exception e) {
        log.error("Unhandled exception", e);
        return new ErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage());
    }
}
