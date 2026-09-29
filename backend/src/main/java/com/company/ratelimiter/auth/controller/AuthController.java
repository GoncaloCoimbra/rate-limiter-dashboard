package com.company.ratelimiter.auth.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
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

import com.company.ratelimiter.auth.dto.AuthUserDto;
import com.company.ratelimiter.auth.dto.ForgotPasswordRequest;
import com.company.ratelimiter.auth.dto.LoginRequest;
import com.company.ratelimiter.auth.dto.RegisterRequest;
import com.company.ratelimiter.auth.dto.ResetPasswordRequest;
import com.company.ratelimiter.auth.exception.InvalidCredentialsException;
import com.company.ratelimiter.auth.service.AppUserService;
import com.company.ratelimiter.auth.service.JwtService;
import com.company.ratelimiter.auth.service.LoginAttemptService;
import com.company.ratelimiter.auth.service.TokenRevocationService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Value("${app.security.cookie-secure:true}")
    private boolean secureCookie;

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final AppUserService users;
    private final PasswordEncoder passwordEncoder;
    private final LoginAttemptService loginAttempts;
    private final TokenRevocationService tokenRevocations;

    public AuthController(AuthenticationManager authenticationManager, JwtService jwtService, AppUserService users, PasswordEncoder passwordEncoder, LoginAttemptService loginAttempts, TokenRevocationService tokenRevocations) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.loginAttempts = loginAttempts;
        this.tokenRevocations = tokenRevocations;
    }

    @PostMapping("/register")
    public Map<String, String> register(@Valid @RequestBody RegisterRequest request) {
        users.register(request.getName(), request.getEmail(), passwordEncoder.encode(request.getPassword()));
        return Map.of("message", "Account created");
    }

    @PostMapping("/forgot-password")
    public Map<String, String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String token = users.requestPasswordReset(request.getEmail());
        // Development stub only: production must deliver this link through a trusted email provider.
        return token == null
                ? Map.of("message", "If the email exists, recovery instructions will be sent shortly")
                : Map.of("message", "Development reset link generated", "resetLink", "/reset-password?token=" + token);
    }

    @PostMapping("/reset-password")
    public Map<String, String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        users.resetPassword(request.getToken(), passwordEncoder.encode(request.getNewPassword()));
        return Map.of("message", "Password reset successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@Valid @RequestBody LoginRequest request) {
        String key = request.getUsername().trim().toLowerCase();
        if (loginAttempts.isBlocked(key)) {
            log.warn("Login blocked after too many attempts username={}", key);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many login attempts");
        }
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
            loginAttempts.success(key);
                String token = jwtService.generate((org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal());
                ResponseCookie cookie = ResponseCookie.from("rate-limiter-session", token)
                    .httpOnly(true)
                    .secure(secureCookie)
                    .sameSite("Strict")
                    .path("/")
                    .maxAge(3600)
                    .build();
                return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body(Map.of("message", "Authenticated"));
        } catch (AuthenticationException exception) {
            loginAttempts.failure(key);
            log.warn("Login failed username={}", key);
            throw new InvalidCredentialsException();
        }
    }

    @GetMapping("/me")
    public AuthUserDto me(Authentication authentication) {
        return users.publicProfile(authentication.getName());
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpServletRequest request) {
        String token = request.getCookies() == null ? null : java.util.Arrays.stream(request.getCookies())
                .filter(cookie -> "rate-limiter-session".equals(cookie.getName()))
                .map(jakarta.servlet.http.Cookie::getValue)
                .findFirst().orElse(null);
        if (token == null) {
            String header = request.getHeader("Authorization");
            token = header != null && header.startsWith("Bearer ") ? header.substring(7) : null;
        }
        if (token != null) {
            tokenRevocations.revoke(jwtService.tokenId(token), jwtService.expiration(token).toInstant());
        }
        ResponseCookie expired = ResponseCookie.from("rate-limiter-session", "")
            .httpOnly(true).secure(secureCookie).sameSite("Strict").path("/").maxAge(0).build();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, expired.toString()).body(Map.of(
                "success", true,
                "message", "Logged out successfully"
        ));
    }
}
