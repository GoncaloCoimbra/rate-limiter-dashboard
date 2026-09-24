package com.company.ratelimiter.auth.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.company.ratelimiter.auth.dto.LoginRequest;
import com.company.ratelimiter.auth.dto.RegisterRequest;
import com.company.ratelimiter.auth.exception.InvalidCredentialsException;
import com.company.ratelimiter.auth.service.AppUserService;
import com.company.ratelimiter.auth.service.JwtService;
import com.company.ratelimiter.auth.service.LoginAttemptService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final AppUserService users;
    private final PasswordEncoder passwordEncoder;
    private final LoginAttemptService loginAttempts;

    public AuthController(AuthenticationManager authenticationManager, JwtService jwtService, AppUserService users, PasswordEncoder passwordEncoder, LoginAttemptService loginAttempts) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.loginAttempts = loginAttempts;
    }

    @PostMapping("/register")
    public Map<String, String> register(@Valid @RequestBody RegisterRequest request) {
        users.register(request.getName(), request.getEmail(), passwordEncoder.encode(request.getPassword()));
        return Map.of("message", "Account created");
    }

    @PostMapping("/forgot-password")
    public Map<String, String> forgotPassword() {
        return Map.of("message", "If the email exists, recovery instructions will be sent shortly");
    }

    @PostMapping("/login")
    public Map<String, String> login(@Valid @RequestBody LoginRequest request) {
        String key = request.getUsername().trim().toLowerCase();
        if (loginAttempts.isBlocked(key)) {
            log.warn("Login blocked after too many attempts username={}", key);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many login attempts");
        }
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
            loginAttempts.success(key);
            return Map.of("token", jwtService.generate((org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal()));
        } catch (AuthenticationException exception) {
            loginAttempts.failure(key);
            log.warn("Login failed username={}", key);
            throw new InvalidCredentialsException();
        }
    }

    @GetMapping("/me")
    public Map<String, Object> me(Authentication authentication) {
        return Map.of(
                "id", 1L,
                "name", authentication.getName(),
                "email", authentication.getName(),
                "roles", authentication.getAuthorities().stream().map(authority -> authority.getAuthority().replace("ROLE_", "")).toList()
        );
    }

    @PostMapping("/logout")
    public Map<String, Object> logout() {
        return Map.of(
                "success", true,
                "message", "Logged out successfully"
        );
    }
}
