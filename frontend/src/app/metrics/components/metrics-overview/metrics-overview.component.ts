import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface MetricsSummaryResponse {
  blockedRequests: number;
  allowedRequests: number;
  averageRate: number;
  totalPolicies: number;
}

interface MetricsComparisonResponse {
  current: MetricsSummaryResponse;
  previous: MetricsSummaryResponse;
  delta: number;
}

@Component({
  selector: 'app-metrics-overview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="metrics-page">
      <header class="page-header">
        <div>
          <p>OBSERVABILIDADE</p>
          <h1>Métricas</h1>
          <span>Acompanhe sinais operacionais em tempo real.</span>
        </div>
      </header>

      <div class="data-state loading" *ngIf="loading" role="status" aria-live="polite">
        <span class="state-icon" aria-hidden="true"><span class="state-pulse"></span></span>
        <div>
          <strong>A carregar métricas do workspace</strong>
          <p>Estamos a sincronizar o resumo e a comparação do período selecionado.</p>
        </div>
      </div>

      <div class="data-state error" *ngIf="error" role="alert">
        <span class="state-icon" aria-hidden="true">!</span>
        <div>
          <strong>Não foi possível carregar as métricas</strong>
          <p>{{ error }}</p>
        </div>
      </div>

      <div class="metrics-layout" *ngIf="!loading && !error">
        <article class="panel signal">
          <div class="panel-heading">
            <div>
              <h2>Sinal live</h2>
              <p>Resumo do período selecionado</p>
            </div>
            <div class="period-select">
              <button type="button" (click)="setRange('24h')" [class.active]="range === '24h'">24h</button>
              <button type="button" (click)="setRange('7d')" [class.active]="range === '7d'">7d</button>
              <button type="button" (click)="setRange('30d')" [class.active]="range === '30d'">30d</button>
            </div>
          </div>

          <div class="signal-number">
            <strong>{{ summary?.averageRate ?? 0 }}</strong>
            <span>Pedidos / segundo</span>
            <b [class.positive]="delta >= 0" [class.negative]="delta < 0">{{ delta >= 0 ? '+' : '' }}{{ delta }}%</b>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <small>Permitidos</small>
              <strong>{{ summary?.allowedRequests ?? 0 }}</strong>
            </div>
            <div class="stat-card">
              <small>Bloqueados</small>
              <strong>{{ summary?.blockedRequests ?? 0 }}</strong>
            </div>
            <div class="stat-card">
              <small>Políticas</small>
              <strong>{{ summary?.totalPolicies ?? 0 }}</strong>
            </div>
          </div>
        </article>

        <aside class="side-note">
          <span>✧</span>
          <strong>Torne esta vista sua</strong>
          <p>Configure a integração para adaptar esta área ao seu workspace.</p>
          <button type="button" (click)="configure()">Configure a integração</button>
        </aside>
      </div>
    </section>
  `,
  styles: [`:host{display:block}.metrics-page{display:grid;gap:22px;max-width:1500px}.page-header p{color:var(--cyan);font-size:10px;font-weight:800;letter-spacing:.14em;margin:0 0 9px}.page-header h1{font:500 34px 'Space Grotesk';margin:0}.page-header span{display:block;color:var(--muted);font-size:14px;margin-top:9px}.metrics-layout{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:18px}.panel,.side-note{border:1px solid var(--border);border-radius:10px;background:var(--card)}.panel{padding:20px}.panel-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.panel h2{font:500 17px 'Space Grotesk';margin:0}.panel p,.side-note p{color:var(--muted);font-size:12px;margin:7px 0 0}.period-select{display:flex;gap:8px}.period-select button{padding:6px 10px;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--text);font-size:11px;cursor:pointer}.period-select button.active{background:rgba(94,217,191,.12);border-color:rgba(94,217,191,.4);color:#5ed9bf}.signal-number{display:flex;align-items:end;gap:12px;margin:30px 0 18px}.signal-number strong{font:500 48px 'Space Grotesk'}.signal-number span{color:var(--muted);font-size:12px;margin-bottom:8px}.signal-number b{font-size:12px;margin:0 0 8px auto}.signal-number b.positive{color:#5ed9bf}.signal-number b.negative{color:var(--red)}.stats-grid{display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));gap:10px}.stat-card{padding:14px;border:1px solid var(--border);border-radius:8px;background:rgba(255,255,255,.02)}.stat-card small{display:block;color:var(--muted);font-size:10px;margin-bottom:8px;letter-spacing:.06em;text-transform:uppercase}.stat-card strong{font-size:24px}.side-note{align-self:start;padding:20px}.side-note>span{display:grid;place-items:center;width:32px;height:32px;border-radius:8px;background:#12383d;color:var(--cyan);font-size:20px;margin-bottom:16px}.side-note strong{font:500 16px 'Space Grotesk'}.side-note button{margin-top:18px;width:100%;border:0;border-radius:7px;background:var(--cyan);color:#06242a;font-weight:700;padding:13px 16px;font-size:11px}.data-state{display:flex;align-items:center;gap:14px;padding:22px 18px;border:1px solid var(--border);border-radius:12px;background:rgba(10,16,24,.35)}.data-state strong{display:block;margin-bottom:6px}.data-state p{color:var(--muted);margin:0}.state-icon{display:inline-grid;place-items:center;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.03);font-weight:700}.state-pulse{display:block;width:12px;height:12px;border-radius:50%;border:2px solid var(--cyan);animation:pulse 1.2s ease-in-out infinite}@keyframes pulse{0%{transform:scale(.75);opacity:.65}70%{transform:scale(1.25);opacity:1}100%{transform:scale(.75);opacity:.65}}@media(max-width:900px){.metrics-layout{grid-template-columns:1fr}.side-note{order:-1}.stats-grid{grid-template-columns:1fr}}`]
})
export class MetricsOverviewComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  summary: MetricsSummaryResponse | null = null;
  delta = 0;
  loading = false;
  error: string | null = null;
  range: '24h' | '7d' | '30d' = '24h';

  ngOnInit(): void {
    this.loadMetrics();
  }

  setRange(range: '24h' | '7d' | '30d'): void {
    this.range = range;
    this.loadMetrics();
  }

  configure(): void {
    void this.router.navigate(['/definicoes']);
  }

  private loadMetrics(): void {
    this.loading = true;
    this.error = null;

    const now = Date.now();
    const windows = { '24h': 24 * 60 * 60 * 1000, '7d': 7 * 24 * 60 * 60 * 1000, '30d': 30 * 24 * 60 * 60 * 1000 };
    const from = now - windows[this.range];

    this.http.get<MetricsComparisonResponse>(`/api/metrics/comparison?from=${from}&to=${now}&previousFrom=${from - windows[this.range]}&previousTo=${from}`).subscribe({
      next: (response) => {
        this.summary = response.current;
        this.delta = Number(response.delta ?? 0);
        this.loading = false;
      },
      error: () => {
        this.summary = null;
        this.delta = 0;
        this.loading = false;
        this.error = 'Não foi possível carregar as métricas do backend.';
      }
    });
  }
}
