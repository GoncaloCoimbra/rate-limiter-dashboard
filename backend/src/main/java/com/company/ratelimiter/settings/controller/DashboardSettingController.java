package com.company.ratelimiter.settings.controller;

import com.company.ratelimiter.settings.entity.DashboardSetting;
import com.company.ratelimiter.settings.repository.DashboardSettingRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import org.springframework.security.core.Authentication;
import com.company.ratelimiter.common.ResourceNotFoundException;

@RestController
@RequestMapping("/api/settings")
public class DashboardSettingController {
    private final DashboardSettingRepository repository;
    public DashboardSettingController(DashboardSettingRepository repository) { this.repository = repository; }
    @GetMapping public List<DashboardSetting> list(Authentication authentication) { return repository.findAllByOwnerUsername(authentication.getName()); }
    @GetMapping("/{key}") public DashboardSetting get(@PathVariable String key, Authentication authentication) {
        return repository.findByKeyAndOwnerUsername(key, authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Setting not found: " + key));
    }
    @PutMapping("/{key}") public DashboardSetting save(@PathVariable String key, @RequestBody String value, Authentication authentication) {
        // Dashboard settings are personal preferences; application-wide settings stay in environment configuration.
        DashboardSetting setting = repository.findByKeyAndOwnerUsername(key, authentication.getName()).orElseGet(DashboardSetting::new);
        setting.setOwnerUsername(authentication.getName());
        setting.setKey(key); setting.setValue(value.replaceAll("^\"|\"$", ""));
        return repository.save(setting);
    }
    @DeleteMapping("/{key}") public void delete(@PathVariable String key, Authentication authentication) {
        DashboardSetting setting = repository.findByKeyAndOwnerUsername(key, authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Setting not found: " + key));
        repository.delete(setting);
    }
}