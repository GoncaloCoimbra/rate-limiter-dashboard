package com.company.ratelimiter.settings.controller;

import com.company.ratelimiter.settings.entity.DashboardSetting;
import com.company.ratelimiter.settings.repository.DashboardSettingRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/settings")
public class DashboardSettingController {
    private final DashboardSettingRepository repository;
    public DashboardSettingController(DashboardSettingRepository repository) { this.repository = repository; }
    @GetMapping public List<DashboardSetting> list() { return repository.findAll(); }
    @PutMapping("/{key}") public DashboardSetting save(@PathVariable String key, @RequestBody String value) {
        DashboardSetting setting = repository.findByKey(key).orElseGet(DashboardSetting::new);
        setting.setKey(key); setting.setValue(value.replaceAll("^\"|\"$", ""));
        return repository.save(setting);
    }
}