import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface PolicyItem {
  id: number;
  name: string;
  algorithm: string;
  limit: number;
  window: string;
  scope?: string;
  status: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CreatePolicyRequest {
  name: string;
  description: string;
  algorithm: string;
  limit: number;
  window: string;
  scope: string;
  status: string;
  usage: number;
  environment: string;
  burst: number;
}

@Injectable({ providedIn: 'root' })
export class PolicyService {
  private readonly http = inject(HttpClient);

  list(page = 0, size = 10): Observable<PageResponse<PolicyItem>> {
    return this.http.get<PageResponse<PolicyItem>>('/api/policies', { params: { page, size } });
  }

  create(request: CreatePolicyRequest): Observable<PolicyItem> {
    return this.http.post<PolicyItem>('/api/policies', request);
  }

  update(id: number, request: Partial<CreatePolicyRequest>): Observable<PolicyItem> {
    return this.http.put<PolicyItem>(`/api/policies/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`/api/policies/${id}`);
  }
}
