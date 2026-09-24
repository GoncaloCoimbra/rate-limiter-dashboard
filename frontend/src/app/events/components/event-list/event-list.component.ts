import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { EventService, RateEventItem } from '../../services/event.service';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section>
      <h2>Eventos</h2>
      <p>Eventos recentes e decisões de bloqueio do rate limiter.</p>

      <p *ngIf="loading">A carregar eventos...</p>
      <ul class="event-list" *ngIf="!loading">
        <li *ngFor="let event of events">
          <strong>{{ event.status }}</strong>
          <span>{{ event.endpoint }}</span>
          <small>{{ event.reason }} · {{ event.ipAddress }}</small>
        </li>
      </ul>
      <nav class="pager" *ngIf="totalPages > 0" aria-label="Paginação de eventos">
        <button type="button" (click)="previousPage()" [disabled]="page === 0">Anterior</button>
        <span>Página {{ page + 1 }} de {{ totalPages }} · {{ totalElements }} eventos</span>
        <button type="button" (click)="nextPage()" [disabled]="page + 1 >= totalPages">Seguinte</button>
      </nav>
    </section>
  `,
  styles: [
    `
      section { display: grid; gap: 1rem; }
      .event-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.75rem; }
      .event-list li { display: grid; gap: 0.25rem; padding: 0.75rem 1rem; border: 1px solid rgba(148,163,184,0.22); border-radius: 12px; background: rgba(15,23,42,0.35); }
      .pager { display: flex; align-items: center; justify-content: space-between; gap: 1rem; color: var(--muted); font-size: .85rem; }
      .pager button { border: 1px solid var(--border); border-radius: 7px; padding: .55rem .8rem; background: var(--card); color: var(--text); }
      small { color: #94a3b8; }
    `
  ]
})
export class EventListComponent implements OnInit {
  private readonly eventService = inject(EventService);
  events: RateEventItem[] = [];
  page = 0;
  totalPages = 0;
  totalElements = 0;
  readonly pageSize = 10;
  loading = true;

  ngOnInit(): void {
    this.loadPage();
  }

  loadPage(): void {
    this.loading = true;
    this.eventService.list(this.page, this.pageSize).subscribe({
      next: response => { this.events = response.content; this.totalPages = response.totalPages; this.totalElements = response.totalElements; this.loading = false; },
      error: () => { this.events = []; this.loading = false; }
    });
  }

  previousPage(): void { if (this.page > 0) { this.page--; this.loadPage(); } }
  nextPage(): void { if (this.page + 1 < this.totalPages) { this.page++; this.loadPage(); } }
}
