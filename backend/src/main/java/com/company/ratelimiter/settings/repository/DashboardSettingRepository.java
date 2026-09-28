package com.company.ratelimiter.settings.repository;

import com.company.ratelimiter.settings.entity.DashboardSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface DashboardSettingRepository extends JpaRepository<DashboardSetting, Long> {
    List<DashboardSetting> findAllByOwnerUsername(String ownerUsername);
    Optional<DashboardSetting> findByKeyAndOwnerUsername(String key, String ownerUsername);
}