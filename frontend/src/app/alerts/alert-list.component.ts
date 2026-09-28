import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { EventService, RateEventItem } from '../events/services/event.service';

@Component({
  selector: 'app-alert-list',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <section class="alerts-page">
      <header class="page-header">
        <div>
          <p>OBSERVABILIDADE</p>
          <h1>Alertas</h1>
          <span>Decisões recentes do rate limiter e eventos relevantes do workspace.</span>
        </div>
      </header>

      <div class="panel loading" *ngIf="loading" role="status" aria-live="polite">
        <strong>A carregar alertas</strong>
        <p>Estamos a sincronizar os eventos mais recentes do backend.</p>
      </div>

      <div class="panel error" *ngIf="error" role="alert">
        <strong>Não foi possível carregar os alertas</strong>
        <p>{{ error }}</p>
      </div>

      <article class="panel" *ngIf="!loading && !error">
        <div class="panel-heading">
          <div>
            <h2>Eventos de tráfego</h2>
            <p>Últimas decisões de bloqueio e autorização registadas.</p>
          </div>
        </div>

        <table *ngIf="events.length; else emptyState">
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Decisão</th>
              <th>Motivo</th>
              <th>Ocorrido em</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let event of events">
              <td>{{ event.endpoint }}</td>
              <td>
                <span class="status" [class.allowed]="event.status === 'ALLOWED'" [class.blocked]="event.status !== 'ALLOWED'">
                  {{ event.status === 'ALLOWED' ? 'Permitido' : 'Bloqueado' }}
                </span>
              </td>
              <td>{{ event.reason }}</td>
              <td>{{ event.occurredAt | date:'dd/MM/yyyy HH:mm:ss' }}</td>
            </tr>
          </tbody>
        </table>

        <ng-template #emptyState>
          <div class="empty-state">
            <strong>Sem alertas por agora</strong>
            <p>O backend ainda não registou eventos para este workspace.</p>
          </div>
        </ng-template>
      </article>
    </section>
  `,
  styles: [`.alerts-page{display:grid;gap:22px;max-width:1500px}.page-header p{color:var(--cyan);font-size:10px;font-weight:800;letter-spacing:.14em;margin:0 0 9px}.page-header h1{font:500 34px 'Space Grotesk';margin:0}.page-header span{display:block;color:var(--muted);font-size:14px;margin-top:9px}.panel{border:1px solid var(--border);border-radius:10px;background:var(--card);padding:20px}.panel.loading,.panel.error{display:grid;gap:6px;align-content:center;min-height:180px}.panel p{color:var(--muted);font-size:12px;margin:8px 0 0}.panel strong{font-size:16px}.panel-heading{margin-bottom:18px}.panel h2{font:500 17px 'Space Grotesk';margin:0}.panel p{margin:7px 0 0}.status{display:inline-flex;align-items:center;padding:6px 10px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:.04em}.status.allowed{background:rgba(94,217,191,.12);color:#5ed9bf}.status.blocked{background:rgba(239,107,131,.12);color:var(--red)}table{width:100%;border-collapse:collapse;font-size:12px}th{text-align:left;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.05em;padding:0 10px 10px}td{padding:14px 10px;border-top:1px solid var(--border);color:var(--text)}.empty-state{padding:34px 12px;border:1px dashed var(--border);border-radius:10px;color:var(--muted);text-align:center}.empty-state strong{display:block;color:var(--text);margin-bottom:8px}`]
})
export class AlertListComponent implements OnInit {
  private readonly eventService = inject(EventService);

  events: RateEventItem[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadAlerts();
  }

  private loadAlerts(): void {
    this.loading = true;
    this.error = null;

    this.eventService.list(0, 10).subscribe({
      next: (response) => {
        this.events = response.content;
        this.loading = false;
      },
      error: () => {
        this.events = [];
        this.loading = false;
        this.error = 'Não foi possível carregar os alertas do backend.';
      }
    });
  }
}

