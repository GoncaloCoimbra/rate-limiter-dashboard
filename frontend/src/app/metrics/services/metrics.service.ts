import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface MetricsSummary {
  blockedRequests: number;
  allowedRequests: number;
  averageRate: number;
  totalPolicies: number;
}

@Injectable({ providedIn: 'root' })
export class MetricsService {
  private readonly http = inject(HttpClient);

  summary(): Observable<MetricsSummary> {
    return this.http.get<MetricsSummary>('/api/metrics/summary');
  }
}
