package com.company.ratelimiter.settings.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "dashboard_settings")
public class DashboardSetting {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "setting_key", nullable = false, unique = true, length = 80) private String key;
    @Column(name = "setting_value", nullable = false, length = 255) private String value;
    public Long getId() { return id; }
    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
}