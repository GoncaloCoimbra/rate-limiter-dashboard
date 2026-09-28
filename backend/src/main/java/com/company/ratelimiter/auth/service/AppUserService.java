package com.company.ratelimiter.auth.service;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.ratelimiter.auth.dto.AuthUserDto;
import com.company.ratelimiter.auth.entity.AppUser;
import com.company.ratelimiter.auth.entity.PasswordResetToken;
import com.company.ratelimiter.auth.repository.AppUserRepository;
import com.company.ratelimiter.auth.repository.PasswordResetTokenRepository;
import com.company.ratelimiter.common.ResourceConflictException;
import com.company.ratelimiter.config.AppSecurityProperties;

import jakarta.annotation.PostConstruct;

@Service
public class AppUserService implements UserDetailsService {
    private final AppUserRepository repository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppSecurityProperties properties;

    public AppUserService(AppUserRepository repository,
                          PasswordResetTokenRepository passwordResetTokenRepository,
                          PasswordEncoder passwordEncoder,
                          AppSecurityProperties properties) {
        this.repository = repository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.properties = properties;
    }

    @PostConstruct
    @Transactional
    void ensureConfiguredAdmin() {
        properties.validate();
        if (repository.existsByEmail(properties.getUsername())) {
            return;
        }
        AppUser user = new AppUser();
        user.setEmail(properties.getUsername());
        user.setName(properties.getUsername());
        user.setPasswordHash(passwordEncoder.encode(properties.getPassword()));
        user.setRole("ADMIN");
        repository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AppUser user = repository.findByEmail(username.trim().toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return User.withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .roles(user.getRole())
                .build();
    }

    @Transactional
    public void register(String name, String email, String passwordHash) {
        String normalizedEmail = email.trim().toLowerCase();
        if (repository.existsByEmail(normalizedEmail)) {
            throw new ResourceConflictException("An account already exists for this email");
        }
        AppUser user = new AppUser();
        user.setEmail(normalizedEmail);
        user.setName(name.trim());
        user.setPasswordHash(passwordHash);
        user.setRole("USER");
        repository.save(user);
    }

    @Transactional(readOnly = true)
    public AuthUserDto publicProfile(String username) {
        AppUser user = repository.findByEmail(username.trim().toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        AuthUserDto profile = new AuthUserDto();
        profile.setId(user.getId());
        profile.setUsername(user.getEmail());
        profile.setName(user.getName());
        profile.setEmail(user.getEmail());
        profile.setRoles(java.util.List.of(user.getRole()));
        return profile;
    }

    @Transactional
    public String requestPasswordReset(String email) {
        AppUser user = repository.findByEmail(email.trim().toLowerCase()).orElse(null);
        if (user == null) {
            return null;
        }

        String token = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plus(Duration.ofMinutes(30));

        passwordResetTokenRepository.deleteAllByUser(user);
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiresAt(expiresAt);
        passwordResetTokenRepository.save(resetToken);

        return token;
    }

    @Transactional
    public void resetPassword(String token, String newPasswordHash) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenAndExpiresAtAfter(token, Instant.now())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired password reset token"));

        AppUser user = resetToken.getUser();
        user.setPasswordHash(newPasswordHash);
        repository.save(user);

        passwordResetTokenRepository.delete(resetToken);
    }
}

