package com.company.ratelimiter.auth.service;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.ratelimiter.auth.entity.AppUser;
import com.company.ratelimiter.auth.repository.AppUserRepository;
import com.company.ratelimiter.config.AppSecurityProperties;

import jakarta.annotation.PostConstruct;

@Service
public class AppUserService implements UserDetailsService {
    private final AppUserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final AppSecurityProperties properties;

    public AppUserService(AppUserRepository repository, PasswordEncoder passwordEncoder, AppSecurityProperties properties) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.properties = properties;
    }

    @PostConstruct
    @Transactional
    void ensureConfiguredAdmin() {
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
            throw new IllegalArgumentException("An account already exists for this email");
        }
        AppUser user = new AppUser();
        user.setEmail(normalizedEmail);
        user.setName(name.trim());
        user.setPasswordHash(passwordHash);
        user.setRole("USER");
        repository.save(user);
    }
}
