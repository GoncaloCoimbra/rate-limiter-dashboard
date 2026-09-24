import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface EndpointSummary {
  endpoint: string;
  requests: number;
  blockedRequests: number;
  allowedRequests: number;
  usageRate: number;
}

@Injectable({ providedIn: 'root' })
export class EndpointService {
  private readonly http = inject(HttpClient);

  list(): Observable<EndpointSummary[]> {
    return this.http.get<EndpointSummary[]>('/api/endpoints');
  }
}