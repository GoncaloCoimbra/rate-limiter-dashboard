import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface RateEventItem {
  id: number;
  reason: string;
  endpoint: string;
  status: string;
  ipAddress: string;
  occurredAt: number;
}

export interface EventPage {
  content: RateEventItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);

  list(page = 0, size = 10): Observable<EventPage> {
    return this.http.get<EventPage>('/api/events', { params: { page, size } });
  }
}
