package com.company.ratelimiter.settings.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "dashboard_settings", uniqueConstraints = @UniqueConstraint(name = "uk_dashboard_settings_owner_key", columnNames = { "owner_username", "setting_key" }))
public class DashboardSetting {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "owner_username", nullable = false, length = 160) private String ownerUsername;
    @Column(name = "setting_key", nullable = false, length = 80) private String key;
    @Column(name = "setting_value", nullable = false, length = 255) private String value;
    public Long getId() { return id; }
    public String getOwnerUsername() { return ownerUsername; }
    public void setOwnerUsername(String ownerUsername) { this.ownerUsername = ownerUsername; }
    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
}