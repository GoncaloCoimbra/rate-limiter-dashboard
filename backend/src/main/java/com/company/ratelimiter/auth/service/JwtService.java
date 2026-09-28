package com.company.ratelimiter.auth.service;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {
    private final SecretKey key;
    private final long expirationMs;

    public JwtService(@Value("${app.security.jwt-secret}") String secret,
                      @Value("${app.security.jwt-expiration-ms:3600000}") long expirationMs) {
        if (secret.length() < 32) throw new IllegalArgumentException("JWT secret must contain at least 32 characters");
        key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generate(UserDetails user) {
        Date now = new Date();
        return Jwts.builder().id(UUID.randomUUID().toString()).subject(user.getUsername()).issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs)).signWith(key).compact();
    }

    public String username(String token) {
        return claims(token).getSubject();
    }

    public String tokenId(String token) {
        return claims(token).getId();
    }

    public Date expiration(String token) {
        return claims(token).getExpiration();
    }

    private io.jsonwebtoken.Claims claims(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}