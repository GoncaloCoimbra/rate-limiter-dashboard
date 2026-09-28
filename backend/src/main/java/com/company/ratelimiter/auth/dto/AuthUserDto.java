package com.company.ratelimiter.auth.dto;

import java.util.List;

public class AuthUserDto {
    private Long id;
    private String username;
    private String name;
    private String email;
    private List<String> roles;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }
}
