import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Activity, AlertTriangle, KeyRound, LucideAngularModule, ShieldCheck, SlidersHorizontal, Zap } from 'lucide-angular';
import { MetricsService, MetricsSummary } from '../metrics/services/metrics.service';
import { EventService, RateEventItem } from '../events/services/event.service';
import { TranslationService } from '../shared/translation.service';
import { ToastService } from '../shared/toast.service';

interface DashboardMetrics { totalRequests: number; allowedRequests: number; blockedRequests: number; blockRate: number; activePolicies: number; eventsTracked: number; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <section class="dashboard">
      <header class="page-heading surface-card">
        <div>
          <p class="eyebrow">{{ i18n.translate('greeting') }}</p>
          <h1>{{ i18n.translate('overviewTitle') }}</h1>
          <p class="subtitle">{{ i18n.translate('overviewDescription') }}</p>
        </div>
        <button class="primary-button" (click)="createPolicy($event)">＋ {{ i18n.translate('createPolicy') }}</button>
      </header>

      <div class="filters surface-card">
        <strong>◷ &nbsp; {{ i18n.translate('dateRange') }}</strong>
        <div class="range-dropdown">
          <button (click)="toggleRange($event)">{{ selectedRange() }} <span>⌄</span></button>
          <div class="range-menu" [class.open]="rangeOpen()">
            <button type="button" (click)="selectRange('Última hora', $event)">Última hora</button>
            <button type="button" (click)="selectRange('Últimas 6 horas', $event)">Últimas 6 horas</button>
            <button type="button" (click)="selectRange('Hoje', $event)">Hoje</button>
          </div>
        </div>
        <label (click)="toggleComparison($event)" [class.active]="comparisonEnabled()"><i></i>{{ i18n.translate('compare') }}</label>
      </div>

      <div class="data-state loading" *ngIf="state() === 'loading'" role="status" aria-live="polite">
        <span class="state-icon" aria-hidden="true"><span class="state-pulse"></span></span>
        <div>
          <strong>A carregar métricas do workspace</strong>
          <p>Estamos a sincronizar eventos, políticas e limites em tempo real.</p>
        </div>
      </div>

      <div class="data-state error" *ngIf="state() === 'error'" role="alert">
        <span class="state-icon" aria-hidden="true">!</span>
        <div>
          <strong>Não foi possível carregar os dados do workspace</strong>
          <p>Verifique a ligação e tente novamente em alguns segundos.</p>
        </div>
        <button type="button" class="secondary-button" (click)="loadDashboard()">Tentar novamente</button>
      </div>

      <div class="data-state empty" *ngIf="state() === 'empty'">
        <span class="state-icon" aria-hidden="true">◎</span>
        <div>
          <strong>Ainda não existem eventos para apresentar</strong>
          <p>Quando a API começar a receber tráfego, esta área mostra o comportamento real.</p>
        </div>
        <button type="button" class="primary-button" (click)="createPolicy($event)">Criar política</button>
      </div>

      <div class="metric-grid">
        <article class="metric-card surface-card" *ngIf="state() === 'success'">
          <div class="metric-top"><span>{{ i18n.translate('requests') }}</span><b style="color:var(--cyan)"><lucide-icon [img]="Activity" size="20" /></b></div>
          <strong>{{ metrics?.totalRequests }}</strong>
          <p>{{ i18n.translate('calculatedEvents') }}</p>
        </article>
        <article class="metric-card surface-card" *ngIf="state() === 'success'">
          <div class="metric-top"><span>{{ i18n.translate('allowed') }}</span><b style="color:var(--blue)"><lucide-icon [img]="ShieldCheck" size="20" /></b></div>
          <strong>{{ metrics?.allowedRequests }}</strong>
          <p>{{ i18n.translate('allowed') }}</p>
        </article>
        <article class="metric-card surface-card" *ngIf="state() === 'success'">
          <div class="metric-top"><span>{{ i18n.translate('blocked') }}</span><b style="color:var(--red)"><lucide-icon [img]="AlertTriangle" size="20" /></b></div>
          <strong>{{ metrics?.blockedRequests }}</strong>
          <p>{{ i18n.translate('blocked') }}</p>
        </article>
        <article class="metric-card surface-card" *ngIf="state() === 'success'">
          <div class="metric-top"><span>{{ i18n.translate('blockRate') }}</span><b style="color:var(--orange)"><lucide-icon [img]="Zap" size="20" /></b></div>
          <strong>{{ metrics?.blockRate }}%</strong>
          <p>{{ i18n.translate('blockRate') }}</p>
        </article>
        <article class="metric-card surface-card" *ngIf="state() === 'success'">
          <div class="metric-top"><span>{{ i18n.translate('activePolicies') }}</span><b style="color:var(--purple)"><lucide-icon [img]="SlidersHorizontal" size="20" /></b></div>
          <strong>{{ metrics?.activePolicies }}</strong>
          <p>{{ i18n.translate('policiesProduction') }}</p>
        </article>
        <article class="metric-card surface-card" *ngIf="state() === 'success'">
          <div class="metric-top"><span>{{ i18n.translate('eventsTracked') }}</span><b style="color:var(--cyan)"><lucide-icon [img]="KeyRound" size="20" /></b></div>
          <strong>{{ metrics?.eventsTracked }}</strong>
          <p>{{ i18n.translate('eventsProcessed') }}</p>
        </article>
      </div>

      <div class="main-grid" *ngIf="state() === 'success'">
        <article class="panel traffic">
          <div class="panel-heading">
            <div>
              <h2>Pedidos ao longo do tempo</h2>
              <p>A série temporal estará disponível quando a API de métricas a fornecer.</p>
            </div>
            <button (click)="toggleRange($event)">{{ selectedRange() }}&nbsp;⌄</button>
          </div>
          <div class="empty">Sem série temporal disponível para este período.</div>
        </article>

        <article class="panel usage">
          <div class="panel-heading">
            <div>
              <h2>Utilização dos limites</h2>
              <p>Sem dados de utilização agregados.</p>
            </div>
            <button class="refresh-btn" (click)="refreshUsage()" [disabled]="refreshing()" aria-label="Atualizar dados">⟳</button>
          </div>
          <div class="empty">A utilização por política será apresentada quando existir uma fonte de dados real.</div>
        </article>
      </div>

      <div class="bottom-grid" *ngIf="state() === 'success'">
        <article class="panel table-panel">
          <div class="panel-heading">
            <div>
              <h2>Endpoints mais ativos</h2>
              <p>Sem agregação de endpoints disponível.</p>
            </div>
            <a routerLink="/endpoints">Ver todos ›</a>
          </div>
          <div class="empty">Ainda não existem dados agregados de endpoints.</div>
        </article>

        <article class="panel events">
          <div class="panel-heading">
            <div>
              <h2>Eventos recentes</h2>
              <p>Últimas decisões reais do rate limiter</p>
            </div>
            <a routerLink="/logs">Ver logs ›</a>
          </div>
          <div class="event" *ngFor="let event of events">
            <span class="event-dot" [class.blocked]="event.status.toLowerCase() === 'blocked'"></span>
            <div>
              <strong>{{ event.status.toLowerCase() === 'blocked' ? 'Taxa limite excedida' : 'Pedido permitido' }}</strong>
              <small>{{ event.endpoint }}</small>
            </div>
            <time>{{ event.ipAddress }} · {{ event.occurredAt | date:'HH:mm' }}</time>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .dashboard {
      display: grid;
      gap: 18px;
      width: 100%;
      max-width: none;
      position: relative;
    }

    .page-heading {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 24px;
    }

    .eyebrow {
      color: var(--cyan);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .16em;
      margin: 0 0 9px;
    }

    .page-heading h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 34px;
      font-weight: 500;
      letter-spacing: -.04em;
      margin: 0;
    }

    .subtitle {
      color: var(--muted);
      font-size: 14px;
      margin: 9px 0 0;
    }

    .primary-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      border: 1px solid transparent;
      border-radius: var(--radius-md);
      padding: 0.78rem 1.1rem;
      font-size: 0.92rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--cyan), #58d7dd 60%, #88f0ee 100%);
      color: #06242a;
      box-shadow: 0 12px 18px rgba(53, 200, 207, 0.2);
    }

    .secondary-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 0.78rem 1.08rem;
      background: transparent;
      color: var(--text);
      font-size: 0.82rem;
      font-weight: 700;
    }

    .filters {
      border: 1px solid var(--border);
      background: var(--card);
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 15px;
      color: var(--muted);
      font-size: 13px;
      position: relative;
      z-index: 10;
    }

    .filters strong { color: #b8c5cc; }
    .filters button, .filters label {
      border: 1px solid #303942;
      background: #11171e;
      color: var(--text);
      border-radius: 6px;
      padding: 9px 13px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .filters button { min-width: 160px; text-align: left; }
    .filters button span { float: right; }
    .filters label {
      display: flex;
      gap: 9px;
      align-items: center;
      font-weight: 500;
      cursor: pointer;
    }

    .filters label.active {
      background: #143337;
      border-color: #1e5a6d;
    }

    .filters label i {
      width: 25px;
      height: 14px;
      border-radius: 20px;
      background: #263a43;
      position: relative;
      transition: background 0.2s ease;
    }

    .filters label.active i { background: #54dfc2; }
    .filters label i:after {
      content: '';
      position: absolute;
      width: 10px;
      height: 10px;
      left: 2px;
      top: 2px;
      border-radius: 50%;
      background: #66848c;
      transition: all 0.2s ease;
    }

    .filters label.active i:after {
      left: 13px;
      background: #082328;
    }

    .range-dropdown { position: relative; display: flex; }
    .range-dropdown button { position: relative; z-index: 100; }
    .range-menu {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 6px;
      min-width: 160px;
      display: flex;
      flex-direction: column;
      gap: 0;
      opacity: 0;
      pointer-events: none;
      transform: translateY(-12px);
      transition: opacity 0.2s ease, transform 0.2s ease;
      z-index: 1000;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    }

    .range-menu.open {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }

    .range-menu button {
      border: none;
      background: transparent;
      color: var(--text);
      padding: 10px 13px;
      text-align: left;
      border-radius: 0;
      font-size: 13px;
      transition: background 0.15s ease;
      cursor: pointer;
      margin: 0;
    }

    .range-menu button:hover { background: #143337; }

    .data-state {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 18px;
      border: 1px solid var(--border);
      border-radius: 14px;
      background: linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.01));
      color: var(--text);
      box-shadow: 0 8px 22px rgba(0,0,0,.05);
    }

    .data-state div { display: grid; gap: 3px; }
    .data-state strong { font-size: 14px; }
    .data-state p { margin: 0; color: var(--muted); font-size: 12px; }
    .data-state.error { border-color: rgba(239,107,131,.35); background: rgba(239,107,131,.05); }
    .data-state.empty { border-color: rgba(53,200,207,.35); background: rgba(53,200,207,.04); }
    .data-state.loading { border-color: rgba(74,141,255,.35); background: rgba(74,141,255,.04); }

    .state-icon {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      border-radius: 10px;
      background: rgba(255,255,255,.03);
      border: 1px solid var(--border);
      color: var(--cyan);
      font-weight: 700;
      flex-shrink: 0;
    }

    .data-state.error .state-icon {
      background: rgba(239,107,131,.12);
      border-color: rgba(239,107,131,.4);
      color: var(--red);
    }

    .data-state.empty .state-icon {
      background: rgba(53,200,207,.12);
      border-color: rgba(53,200,207,.38);
      color: var(--cyan);
    }

    .data-state.loading .state-icon { position: relative; overflow: hidden; }
    .state-pulse {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--cyan);
      box-shadow: 0 0 0 0 rgba(53,200,207,.55);
      animation: pulse 1.6s infinite;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(53,200,207,.58); }
      70% { box-shadow: 0 0 0 12px rgba(53,200,207,0); }
      100% { box-shadow: 0 0 0 0 rgba(53,200,207,0); }
    }

    .data-state .secondary-button,
    .data-state .primary-button {
      padding: 10px 14px;
      font-size: 12px;
    }

    .data-state .primary-button { margin-left: auto; }

    .metric-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }

    .metric-card {
      min-height: 168px;
      padding: 16px;
      position: relative;
      overflow: hidden;
      border: 1px solid var(--border);
      background: var(--card);
      border-radius: 10px;
    }

    .metric-top {
      display: flex;
      justify-content: space-between;
      color: var(--muted);
      font-size: 12px;
    }

    .metric-card strong {
      display: block;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 28px;
      margin-top: 18px;
    }

    .metric-card p {
      color: #687782;
      font-size: 10px;
      margin-top: 14px;
    }

    .main-grid,
    .bottom-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 16px;
    }

    .bottom-grid { grid-template-columns: 1.4fr 1fr; }

    .panel {
      padding: 20px;
      min-width: 0;
      border: 1px solid var(--border);
      background: var(--card);
      border-radius: 12px;
    }

    .panel-heading {
      display: flex;
      justify-content: space-between;
      align-items: start;
      gap: 12px;
    }

    .panel h2 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 16px;
      font-weight: 500;
      margin: 0;
    }

    .panel p {
      color: var(--muted);
      font-size: 11px;
      margin: 6px 0 0;
    }

    .panel-heading button,
    .panel-heading > a {
      border: 1px solid #303942;
      background: #11171e;
      color: #aebbc3;
      border-radius: 6px;
      padding: 8px 10px;
      text-decoration: none;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .panel-heading button:disabled { opacity: 0.5; cursor: not-allowed; }
    .refresh-btn { border: none !important; background: none !important; color: #aebbc3 !important; padding: 8px !important; }

    .event {
      display: flex;
      gap: 10px;
      align-items: start;
      padding: 13px 0;
      border-bottom: 1px solid #202830;
    }

    .event:last-child { border-bottom: 0; }
    .event-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #54dfc2;
      margin-top: 5px;
      flex-shrink: 0;
    }

    .event-dot.blocked { background: var(--red); }
    .event div { display: grid; gap: 4px; min-width: 0; }
    .event strong { font-size: 12px; font-weight: 500; }
    .event small, .event time { color: var(--muted); font-size: 10px; }
    .event time { margin-left: auto; text-align: right; }

    .empty {
      padding-top: 24px;
      color: var(--muted);
      font-size: 12px;
    }

    @media (max-width: 1200px) {
      .metric-grid { grid-template-columns: repeat(2, minmax(200px, 1fr)); }
    }

    @media (max-width: 800px) {
      .page-heading { align-items: start; flex-direction: column; }
      .main-grid, .bottom-grid { grid-template-columns: 1fr; }
      .filters { flex-wrap: wrap; }
      .metric-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 480px) {
      .metric-grid { grid-template-columns: 1fr; }
      .page-heading h1 { font-size: 28px; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  readonly i18n = inject(TranslationService);
  readonly toast = inject(ToastService);
  private readonly metricsService = inject(MetricsService);
  private readonly eventService = inject(EventService);
  private readonly router = inject(Router);

  readonly rangeOpen = signal(false);
  readonly selectedRange = signal('Última hora');
  readonly refreshing = signal(false);
  readonly state = signal<'loading' | 'empty' | 'error' | 'success'>('loading');
  readonly comparisonEnabled = signal(false);
  readonly visibleSeries = signal({ allowed: true, blocked: true });

  summary: MetricsSummary | null = null;
  events: RateEventItem[] = [];
  metrics: DashboardMetrics | null = null;

  readonly Activity = Activity;
  readonly ShieldCheck = ShieldCheck;
  readonly AlertTriangle = AlertTriangle;
  readonly Zap = Zap;
  readonly SlidersHorizontal = SlidersHorizontal;
  readonly KeyRound = KeyRound;

  ngOnInit(): void {
    this.loadDashboard();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isClickInsideDropdown = target.closest('.range-dropdown') !== null;
    if (!isClickInsideDropdown && this.rangeOpen()) {
      this.rangeOpen.set(false);
    }
  }

  loadDashboard(): void {
    this.state.set('loading');
    forkJoin({ summary: this.metricsService.summary(), events: this.eventService.list(0, 5) }).subscribe({
      next: ({ summary, events }) => {
        this.summary = summary;
        this.events = events.content;
        const total = summary.allowedRequests + summary.blockedRequests;
        this.metrics = {
          totalRequests: total,
          allowedRequests: summary.allowedRequests,
          blockedRequests: summary.blockedRequests,
          blockRate: total ? Math.round(summary.blockedRequests / total * 100) : 0,
          activePolicies: summary.totalPolicies,
          eventsTracked: total
        };
        this.state.set(total === 0 && this.events.length === 0 ? 'empty' : 'success');
      },
      error: () => {
        this.summary = null;
        this.metrics = null;
        this.events = [];
        this.state.set('error');
      }
    });
  }

  toggleRange(event?: Event): void {
    event?.stopPropagation();
    this.rangeOpen.update((open) => !open);
  }

  selectRange(range: string, event: Event): void {
    event.stopPropagation();
    this.selectedRange.set(range);
    this.rangeOpen.set(false);
    this.loadDashboard();
    this.toast.show(`Período: ${range.toLowerCase()}`);
  }

  toggleComparison(event: Event): void {
    event.stopPropagation();
    this.comparisonEnabled.update((enabled) => !enabled);
    this.toast.show(this.comparisonEnabled() ? 'Comparação ativada' : 'Comparação desativada');
  }

  createPolicy(event: Event): void {
    event.stopPropagation();
    void this.router.navigate(['/policies']);
  }

  showAllSeries(): void {
    this.visibleSeries.set({ allowed: true, blocked: true });
    this.toast.show('Todas as séries visíveis');
  }

  hideAllSeries(): void {
    this.visibleSeries.set({ allowed: false, blocked: false });
    this.toast.show('Todas as séries ocultas');
  }

  refreshUsage(): void {
    if (this.refreshing() || this.state() === 'loading') return;
    this.refreshing.set(true);
    this.toast.show('A atualizar dados...');

    forkJoin({ summary: this.metricsService.summary(), events: this.eventService.list(0, 5) }).subscribe({
      next: ({ summary, events }) => {
        this.summary = summary;
        this.events = events.content;
        const total = summary.allowedRequests + summary.blockedRequests;
        this.metrics = {
          totalRequests: total,
          allowedRequests: summary.allowedRequests,
          blockedRequests: summary.blockedRequests,
          blockRate: total ? Math.round(summary.blockedRequests / total * 100) : 0,
          activePolicies: summary.totalPolicies,
          eventsTracked: total
        };
        this.state.set(total === 0 && this.events.length === 0 ? 'empty' : 'success');
        this.refreshing.set(false);
        this.toast.show('Dados atualizados');
      },
      error: () => {
        this.state.set('error');
        this.refreshing.set(false);
        this.toast.show('Erro ao atualizar dados');
      }
    });
  }
}
