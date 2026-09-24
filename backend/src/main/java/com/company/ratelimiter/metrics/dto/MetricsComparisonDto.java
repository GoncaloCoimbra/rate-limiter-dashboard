package com.company.ratelimiter.metrics.dto;

public class MetricsComparisonDto {

    private MetricsSummaryDto current;
    private MetricsSummaryDto previous;
    private double delta;

    public MetricsSummaryDto getCurrent() {
        return current;
    }

    public void setCurrent(MetricsSummaryDto current) {
        this.current = current;
    }

    public MetricsSummaryDto getPrevious() {
        return previous;
    }

    public void setPrevious(MetricsSummaryDto previous) {
        this.previous = previous;
    }

    public double getDelta() {
        return delta;
    }

    public void setDelta(double delta) {
        this.delta = delta;
    }
}
