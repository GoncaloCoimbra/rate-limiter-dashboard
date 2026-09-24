package com.company.ratelimiter.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.company.ratelimiter.auth.exception.InvalidCredentialsException;

import jakarta.validation.ConstraintViolationException;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> validation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .findFirst()
                .orElse("Invalid request");
        return ResponseEntity.badRequest().body(ApiResponse.error(message));
    }

    @ExceptionHandler({IllegalArgumentException.class, ConstraintViolationException.class})
    public ResponseEntity<ApiResponse<Object>> badRequest(Exception exception) {
        return ResponseEntity.badRequest().body(ApiResponse.error(exception.getMessage()));
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiResponse<Object>> invalidCredentials() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Invalid credentials"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> internalError(Exception exception) {
        log.error("Unhandled exception", exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An unexpected error occurred"));
    }
}