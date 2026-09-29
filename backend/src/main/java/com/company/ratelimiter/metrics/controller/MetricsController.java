package com.company.ratelimiter.metrics.controller;

import com.company.ratelimiter.metrics.dto.MetricsComparisonDto;
import com.company.ratelimiter.metrics.dto.MetricsQueryDto;
import com.company.ratelimiter.metrics.dto.MetricsSummaryDto;
import com.company.ratelimiter.metrics.service.MetricsService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import java.util.List;
import com.company.ratelimiter.metrics.dto.EndpointActivityDto;
import com.company.ratelimiter.metrics.dto.MetricsBucketDto;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

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

    @GetMapping("/series")
    public List<MetricsBucketDto> series(@RequestParam(required = false) Long from,
                                        @RequestParam(required = false) Long to,
                                        Authentication authentication) {
        MetricsQueryDto query = range(from, to);
        return metricsService.getTrafficSeries(query, authentication.getName());
    }

    @GetMapping("/endpoints")
    public List<EndpointActivityDto> endpoints(@RequestParam(required = false) Long from,
                                              @RequestParam(required = false) Long to,
                                              @RequestParam(defaultValue = "5") int limit,
                                              Authentication authentication) {
        MetricsQueryDto query = range(from, to);
        return metricsService.getEndpointActivity(query, authentication.getName(), limit);
    }

    private static MetricsQueryDto range(Long from, Long to) {
        long now = System.currentTimeMillis();
        long rangeFrom = from == null ? now - 24 * 60 * 60 * 1000L : from;
        long rangeTo = to == null ? now : to;
        if (rangeFrom > rangeTo) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "from must not be after to");
        }
        MetricsQueryDto query = new MetricsQueryDto();
        query.setFrom(rangeFrom);
        query.setTo(rangeTo);
        return query;
    }
}
