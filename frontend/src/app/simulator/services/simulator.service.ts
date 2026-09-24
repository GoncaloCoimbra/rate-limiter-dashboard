import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export interface SimulatorResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
  resetAt: number;
}

interface ApiResponse<T> { data: T; }

@Injectable({ providedIn: 'root' })
export class SimulatorService {
  private readonly http = inject(HttpClient);

  evaluate(policyId: number, key = 'simulator'): Observable<SimulatorResult> {
    return this.http.post<ApiResponse<SimulatorResult>>('/api/ratelimit/check', {
      policyId,
      key,
    }).pipe(map(response => response.data));
  }
}
