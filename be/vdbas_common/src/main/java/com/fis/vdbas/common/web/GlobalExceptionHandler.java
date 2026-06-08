package com.fis.vdbas.common.web;

import com.fis.vdbas.common.dto.ErrorResponseDto;
import com.fis.vdbas.common.dto.FieldErrorDto;
import com.fis.vdbas.common.exception.AccessDeniedException;
import com.fis.vdbas.common.exception.BusinessException;
import com.fis.vdbas.common.exception.DatabaseConstraintException;
import com.fis.vdbas.common.exception.DuplicateResourceException;
import com.fis.vdbas.common.exception.InvalidOperationException;
import com.fis.vdbas.common.exception.ResourceNotFoundException;
import jakarta.persistence.OptimisticLockException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final MessageSource messageSource;

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponseDto handleValidationExceptions(MethodArgumentNotValidException ex, HttpServletRequest request) {
        if (log.isDebugEnabled()) {
            log.debug("Validation error: {}", ex.getMessage());
        }
        List<FieldErrorDto> details = ex.getBindingResult().getAllErrors().stream()
                .map(error -> FieldErrorDto.builder()
                        .field(((FieldError) error).getField())
                        .message(error.getDefaultMessage())
                        .build())
                .collect(Collectors.toList());

        return ErrorResponseDto.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message(getMessage("error.validation.failed"))
                .errorCode("VALIDATION_FAILED")
                .path(request.getRequestURI())
                .details(details)
                .build();
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponseDto handleResourceNotFoundException(ResourceNotFoundException ex, HttpServletRequest request) {
        if (log.isDebugEnabled()) {
            log.debug("Resource not found: {}", ex.getMessage());
        }
        return ErrorResponseDto.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.NOT_FOUND.value())
                .error(HttpStatus.NOT_FOUND.getReasonPhrase())
                .message(resolveMessage(ex))
                .errorCode(ex.getErrorCode())
                .path(request.getRequestURI())
                .build();
    }

    @ExceptionHandler(DuplicateResourceException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorResponseDto handleDuplicateResourceException(DuplicateResourceException ex,
            HttpServletRequest request) {
        if (log.isDebugEnabled()) {
            log.debug("Duplicate resource: {}", ex.getMessage());
        }
        return ErrorResponseDto.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.CONFLICT.value())
                .error(HttpStatus.CONFLICT.getReasonPhrase())
                .message(resolveMessage(ex))
                .errorCode(ex.getErrorCode())
                .path(request.getRequestURI())
                .build();
    }

    @ExceptionHandler(InvalidOperationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponseDto handleInvalidOperationException(InvalidOperationException ex, HttpServletRequest request) {
        if (log.isDebugEnabled()) {
            log.debug("Invalid operation: {}", ex.getMessage());
        }
        return ErrorResponseDto.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message(resolveMessage(ex))
                .errorCode(ex.getErrorCode())
                .path(request.getRequestURI())
                .build();
    }

    @ExceptionHandler(DatabaseConstraintException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorResponseDto handleDatabaseConstraintException(DatabaseConstraintException ex,
            HttpServletRequest request) {
        log.warn("Database constraint violation: {}", ex.getMessage());
        return ErrorResponseDto.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.CONFLICT.value())
                .error(HttpStatus.CONFLICT.getReasonPhrase())
                .message(resolveMessage(ex))
                .errorCode(ex.getErrorCode())
                .path(request.getRequestURI())
                .build();
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorResponseDto handleDataIntegrityViolationException(DataIntegrityViolationException ex,
            HttpServletRequest request) {
        log.warn("Data integrity violation", ex);
        String message = getMessage("error.database.constraint");

        String rootMessage = ex.getRootCause() != null ? ex.getRootCause().getMessage() : ex.getMessage();
        if (rootMessage != null) {
            if (rootMessage.contains("duplicate key") || rootMessage.contains("unique constraint")) {
                message = getMessage("error.database.duplicate");
            } else if (rootMessage.contains("foreign key")) {
                message = getMessage("error.database.foreign.key");
            }
        }

        return ErrorResponseDto.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.CONFLICT.value())
                .error(HttpStatus.CONFLICT.getReasonPhrase())
                .message(message)
                .errorCode("DATABASE_CONSTRAINT_VIOLATION")
                .path(request.getRequestURI())
                .build();
    }

    @ExceptionHandler(OptimisticLockException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorResponseDto handleOptimisticLockException(OptimisticLockException ex, HttpServletRequest request) {
        log.warn("Optimistic lock exception", ex);
        return ErrorResponseDto.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.CONFLICT.value())
                .error(HttpStatus.CONFLICT.getReasonPhrase())
                .message(getMessage("error.concurrent.modification"))
                .errorCode("CONCURRENT_MODIFICATION")
                .path(request.getRequestURI())
                .build();
    }

    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ErrorResponseDto handleCustomAccessDeniedException(AccessDeniedException ex, HttpServletRequest request) {
        if (log.isDebugEnabled()) {
            log.debug("Access denied (custom): {}", ex.getMessage());
        }
        return ErrorResponseDto.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.FORBIDDEN.value())
                .error(HttpStatus.FORBIDDEN.getReasonPhrase())
                .message(resolveMessage(ex))
                .errorCode(ex.getErrorCode() != null ? ex.getErrorCode() : "ACCESS_DENIED")
                .path(request.getRequestURI())
                .build();
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ErrorResponseDto handleSpringAccessDeniedException(
            org.springframework.security.access.AccessDeniedException ex, HttpServletRequest request) {
        log.warn("Access denied: {}", ex.getMessage());
        return ErrorResponseDto.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.FORBIDDEN.value())
                .error(HttpStatus.FORBIDDEN.getReasonPhrase())
                .message(getMessage("error.access.denied"))
                .errorCode("ACCESS_DENIED")
                .path(request.getRequestURI())
                .build();
    }

    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponseDto handleBusinessException(BusinessException ex, HttpServletRequest request) {
        log.warn("Business exception: {}", ex.getMessage());
        return ErrorResponseDto.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message(resolveMessage(ex))
                .errorCode(ex.getErrorCode())
                .path(request.getRequestURI())
                .build();
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponseDto handleGenericException(Exception ex, HttpServletRequest request) {
        log.error("Unexpected error occurred", ex);
        return ErrorResponseDto.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error(HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase())
                .message(getMessage("error.internal.server"))
                .errorCode("INTERNAL_SERVER_ERROR")
                .path(request.getRequestURI())
                .build();
    }

    // ─── Private ───────────────────────────────────────────────────────────────

    private String resolveMessage(BusinessException ex) {
        if (ex.getMessageKey() != null && !ex.getMessageKey().isEmpty()) {
            return getMessage(ex.getMessageKey(), ex.getMessageArgs(), ex.getMessage());
        }
        return ex.getMessage();
    }

    private String getMessage(String code, Object[] args, String defaultMessage) {
        try {
            return messageSource.getMessage(code, args, LocaleContextHolder.getLocale());
        } catch (Exception e) {
            log.warn("Failed to resolve message for code: {}", code, e);
            return defaultMessage != null ? defaultMessage : code;
        }
    }

    private String getMessage(String code, Object... args) {
        return getMessage(code, args, code);
    }
}
