import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MetricsSummary {
  blockedRequests: number;
  allowedRequests: number;
  averageRate: number;
  totalPolicies: number;
}

export interface TrafficBucket {
  bucketStart: number;
  allowedRequests: number;
  blockedRequests: number;
}

export interface EndpointActivity {
  endpoint: string;
  requestCount: number;
  blockedRequests: number;
}

export interface MetricsComparison {
  current: MetricsSummary;
  previous: MetricsSummary;
  delta: number;
}

@Injectable({ providedIn: 'root' })
export class MetricsService {
  private readonly http = inject(HttpClient);

  summary(from: number, to: number): Observable<MetricsSummary> {
    return this.http.get<MetricsSummary>('/api/metrics/summary', { params: this.rangeParams(from, to) });
  }

  comparison(from: number, to: number, previousFrom: number, previousTo: number): Observable<MetricsComparison> {
    const params = this.rangeParams(from, to)
      .set('previousFrom', previousFrom)
      .set('previousTo', previousTo);
    return this.http.get<MetricsComparison>('/api/metrics/comparison', { params });
  }

  trafficSeries(from: number, to: number): Observable<TrafficBucket[]> {
    return this.http.get<TrafficBucket[]>('/api/metrics/series', { params: this.rangeParams(from, to) });
  }

  endpointActivity(from: number, to: number, limit = 5): Observable<EndpointActivity[]> {
    const params = this.rangeParams(from, to).set('limit', limit);
    return this.http.get<EndpointActivity[]>('/api/metrics/endpoints', { params });
  }

  private rangeParams(from: number, to: number): HttpParams {
    return new HttpParams().set('from', from).set('to', to);
  }
}
