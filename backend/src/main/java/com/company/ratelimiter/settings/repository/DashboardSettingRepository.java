package com.company.ratelimiter.settings.repository;

import com.company.ratelimiter.settings.entity.DashboardSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DashboardSettingRepository extends JpaRepository<DashboardSetting, Long> {
    Optional<DashboardSetting> findByKey(String key);
}