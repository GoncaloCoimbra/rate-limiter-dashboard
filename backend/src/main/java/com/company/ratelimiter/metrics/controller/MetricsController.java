package com.company.ratelimiter.metrics.controller;

import com.company.ratelimiter.metrics.dto.MetricsComparisonDto;
import com.company.ratelimiter.metrics.dto.MetricsQueryDto;
import com.company.ratelimiter.metrics.dto.MetricsSummaryDto;
import com.company.ratelimiter.metrics.service.MetricsService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/metrics")
public class MetricsController {

    private final MetricsService metricsService;

    public MetricsController(MetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @GetMapping("/summary")
    public MetricsSummaryDto summary(@RequestParam(required = false) Long from,
                                    @RequestParam(required = false) Long to,
                                    Authentication authentication) {
        MetricsQueryDto query = new MetricsQueryDto();
        query.setFrom(from);
        query.setTo(to);
        return metricsService.getSummary(query, authentication.getName());
    }

    @GetMapping("/comparison")
    public MetricsComparisonDto comparison(@RequestParam(required = false) Long from,
                                          @RequestParam(required = false) Long to,
                                          @RequestParam(required = false) Long previousFrom,
                                          @RequestParam(required = false) Long previousTo,
                                          Authentication authentication) {
        MetricsQueryDto current = new MetricsQueryDto();
        current.setFrom(from);
        current.setTo(to);

        MetricsQueryDto previous = new MetricsQueryDto();
        previous.setFrom(previousFrom);
        previous.setTo(previousTo);

        return metricsService.compare(current, previous, authentication.getName());
    }
}
