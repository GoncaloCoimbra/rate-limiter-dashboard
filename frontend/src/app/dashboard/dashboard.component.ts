import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Activity, AlertTriangle, KeyRound, LucideAngularModule, ShieldCheck, SlidersHorizontal, Zap } from 'lucide-angular';
import { MetricsService, MetricsSummary } from '../metrics/services/metrics.service';
import { EventService, RateEventItem } from '../events/services/event.service';
import { TranslationService } from '../shared/translation.service';
import { ToastService } from '../shared/toast.service';

interface DashboardMetrics { totalRequests: number; allowedRequests: number; blockedRequests: number; blockRate: number; activePolicies: number; eventsTracked: number; }

const fallbackMetrics: DashboardMetrics = {
  totalRequests: 8,
  allowedRequests: 4,
  blockedRequests: 4,
  blockRate: 50,
  activePolicies: 3,
  eventsTracked: 8
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <section class="dashboard">
      <header class="page-heading"><div><p class="eyebrow">{{ i18n.translate('greeting') }}</p><h1>{{ i18n.translate('overviewTitle') }}</h1><p class="subtitle">{{ i18n.translate('overviewDescription') }}</p></div><button class="primary" (click)="createPolicy($event)">＋ {{ i18n.translate('createPolicy') }}</button></header>
      <div class="filters"><strong>◷ &nbsp; {{ i18n.translate('dateRange') }}</strong><div class="range-dropdown"><button (click)="toggleRange($event)">{{ selectedRange() }} <span>⌄</span></button><div class="range-menu" [class.open]="rangeOpen()"><button type="button" (click)="selectRange('Última hora', $event)">Última hora</button><button type="button" (click)="selectRange('Últimas 6 horas', $event)">Últimas 6 horas</button><button type="button" (click)="selectRange('Hoje', $event)">Hoje</button></div></div><label (click)="toggleComparison($event)" [class.active]="comparisonEnabled()"><i></i>{{ i18n.translate('compare') }}</label></div>
      <div class="demo-banner"><span class="banner-icon">✧</span><strong>{{ i18n.translate('demo') }}</strong><span>Está a explorar dados de tráfego de exemplo. Ligue o workspace para ver sinais reais.</span><button (click)="onConnectWorkspace()">{{ i18n.translate('connect') }}&nbsp; ›</button></div>
      <div class="metric-grid">
        <article class="metric-card"><div class="metric-top"><span>{{ i18n.translate('requests') }}</span><b style="color:var(--cyan)"><lucide-icon [img]="Activity" size="20" /></b></div><strong>{{ metrics.totalRequests }}</strong><small><i></i> LIVE</small><p>{{ i18n.translate('calculatedEvents') }}</p><svg class="sparkline" viewBox="0 0 110 30" preserveAspectRatio="none"><polyline points="0,21 15,12 30,18 45,7 60,15 75,5 90,12 110,3" fill="none" stroke="var(--cyan)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /></svg></article>
        <article class="metric-card"><div class="metric-top"><span>{{ i18n.translate('allowed') }}</span><b style="color:var(--blue)"><lucide-icon [img]="ShieldCheck" size="20" /></b></div><strong>{{ metrics.allowedRequests }}</strong><small><i></i> LIVE</small><p>{{ i18n.translate('allowed') }}</p><svg class="sparkline" viewBox="0 0 110 30" preserveAspectRatio="none"><polyline points="0,20 15,9 30,16 45,7 60,13 75,8 90,10 110,2" fill="none" stroke="var(--blue)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /></svg></article>
        <article class="metric-card"><div class="metric-top"><span>{{ i18n.translate('blocked') }}</span><b style="color:var(--red)"><lucide-icon [img]="AlertTriangle" size="20" /></b></div><strong>{{ metrics.blockedRequests }}</strong><small><i></i> LIVE</small><p>{{ i18n.translate('blocked') }}</p><svg class="sparkline" viewBox="0 0 110 30" preserveAspectRatio="none"><polyline points="0,5 15,19 30,10 45,21 60,11 75,18 90,7 110,15" fill="none" stroke="var(--red)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /></svg></article>
        <article class="metric-card"><div class="metric-top"><span>{{ i18n.translate('blockRate') }}</span><b style="color:var(--orange)"><lucide-icon [img]="Zap" size="20" /></b></div><strong>{{ metrics.blockRate }}%</strong><small><i></i> LIVE</small><p>{{ i18n.translate('blockRate') }}</p><svg class="sparkline" viewBox="0 0 110 30" preserveAspectRatio="none"><polyline points="0,17 15,11 30,14 45,8 60,20 75,12 90,17 110,6" fill="none" stroke="var(--orange)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /></svg></article>
        <article class="metric-card"><div class="metric-top"><span>{{ i18n.translate('activePolicies') }}</span><b style="color:var(--purple)"><lucide-icon [img]="SlidersHorizontal" size="20" /></b></div><strong>{{ metrics.activePolicies.toString().padStart(2, '0') }}</strong><small><i></i> LIVE</small><p>{{ i18n.translate('policiesProduction') }}</p><svg class="sparkline" viewBox="0 0 110 30" preserveAspectRatio="none"><polyline points="0,18 15,15 30,8 45,12 60,5 75,10 90,6 110,11" fill="none" stroke="var(--purple)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /></svg></article>
        <article class="metric-card"><div class="metric-top"><span>{{ i18n.translate('eventsTracked') }}</span><b style="color:var(--cyan)"><lucide-icon [img]="KeyRound" size="20" /></b></div><strong>{{ metrics.eventsTracked }}</strong><small><i></i> LIVE</small><p>{{ i18n.translate('eventsProcessed') }}</p><svg class="sparkline" viewBox="0 0 110 30" preserveAspectRatio="none"><polyline points="0,17 15,8 30,14 45,6 60,12 75,4 90,8 110,2" fill="none" stroke="var(--cyan)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /></svg></article>
      </div>
      <div class="data-status">{{ summary ? 'Atualizado agora a partir dos eventos do workspace' : 'A mostrar dados de demonstração enquanto o workspace sincroniza' }}</div>
      <div class="main-grid"><article class="panel traffic"><div class="panel-heading"><div><h2>Pedidos ao longo do tempo</h2><p>Pedidos permitidos vs bloqueados</p></div><button (click)="toggleRange($event)" [disabled]="loading()">{{ selectedRange() }}&nbsp;⌄</button></div><div class="legend"><button (click)="showAllSeries()">Mostrar todos</button><button (click)="hideAllSeries()">Ocultar todos</button><span [style.opacity]="visibleSeries().allowed ? 1 : 0.3"><i class="dot cyan"></i>Permitidos</span><span [style.opacity]="visibleSeries().blocked ? 1 : 0.3"><i class="dot red"></i>Bloqueados</span></div><div class="chart-container" [class.loading]="loading()"><svg class="area-chart" viewBox="0 0 720 220" preserveAspectRatio="none"><g class="grid-lines"><line x1="0" y1="20" x2="720" y2="20"/><line x1="0" y1="75" x2="720" y2="75"/><line x1="0" y1="130" x2="720" y2="130"/><line x1="0" y1="185" x2="720" y2="185"/></g><polyline *ngIf="visibleSeries().allowed" points="0,150 55,120 105,135 160,75 215,105 270,68 325,94 380,44 435,72 490,58 545,82 600,33 660,62 720,25" fill="none" stroke="var(--cyan)" stroke-width="3"/><polyline *ngIf="visibleSeries().blocked" points="0,185 55,168 105,178 160,143 215,158 270,126 325,151 380,121 435,147 490,112 545,138 600,105 660,123 720,92" fill="none" stroke="var(--red)" stroke-width="3"/></svg><div class="loading-overlay" *ngIf="loading()"><span>Carregando dados...</span></div></div></article>
        <article class="panel usage"><div class="panel-heading"><div><h2>Utilização dos limites</h2><p>Capacidade atual por política</p></div><button class="refresh-btn" (click)="refreshUsage()" [disabled]="refreshing()"><span [style.animation]="refreshing() ? 'spin 0.6s linear infinite' : 'none'">⟳</span></button></div><div class="donut"><div><strong>64%</strong><small>média</small></div></div><div class="usage-list"><span><i class="cyan-dot"></i>Public API <b>68%</b></span><span><i class="red-dot"></i>Authentication <b>84%</b></span><span><i class="purple-dot"></i>Premium API <b>42%</b></span></div></article></div>
      <div class="bottom-grid"><article class="panel table-panel"><div class="panel-heading"><div><h2>Endpoints mais ativos</h2><p>Tráfego por rota nas últimas 24 horas</p></div><a routerLink="/endpoints">Ver todos ›</a></div><table><thead><tr><th>Endpoint</th><th>Método</th><th>Pedidos</th><th>Taxa</th><th>Estado</th></tr></thead><tbody><tr><td>/api/v1/users</td><td><span class="method get">GET</span></td><td>24.8k</td><td>99.2%</td><td><span class="status good">Saudável</span></td></tr><tr><td>/api/v1/auth/token</td><td><span class="method post">POST</span></td><td>18.2k</td><td>96.8%</td><td><span class="status good">Saudável</span></td></tr><tr><td>/api/v1/checkout</td><td><span class="method post">POST</span></td><td>9.7k</td><td>88.4%</td><td><span class="status warn">Atenção</span></td></tr></tbody></table></article><article class="panel events"><div class="panel-heading"><div><h2>Eventos recentes</h2><p>Últimas decisões do rate limiter</p></div><a routerLink="/logs">Ver logs ›</a></div><div class="event" *ngFor="let event of events"><span class="event-dot" [class.blocked]="event.status.toLowerCase() === 'blocked'"></span><div><strong>{{ event.status.toLowerCase() === 'blocked' ? 'Taxa limite excedida' : 'Pedido permitido' }}</strong><small>{{ event.endpoint }}</small></div><time>{{ event.ipAddress }} · {{ event.occurredAt | date:'HH:mm' }}</time></div><div class="empty" *ngIf="!events.length">Nenhum evento recente disponível.</div></article></div>
    </section>
  `,
  styles: [`.dashboard{display:grid;gap:18px;max-width:1500px;position:relative}.page-heading{display:flex;justify-content:space-between;align-items:end;gap:24px}.eyebrow{color:var(--cyan);font-size:10px;font-weight:700;letter-spacing:.16em;margin:0 0 9px}.page-heading h1{font-family:'Space Grotesk',sans-serif;font-size:34px;font-weight:500;letter-spacing:-.04em;margin:0}.subtitle{color:var(--muted);font-size:14px;margin:9px 0 0}.primary{background:var(--cyan);border-radius:7px;color:#082328;font-weight:700;padding:13px 17px;text-decoration:none;white-space:nowrap;border:none;cursor:pointer}.filters,.demo-banner{border:1px solid var(--border);background:var(--card);border-radius:8px;display:flex;align-items:center;gap:16px;padding:12px 15px;color:var(--muted);font-size:13px;position:relative;z-index:10}.filters strong{color:#b8c5cc}.filters button,.filters label{border:1px solid #303942;background:#11171e;color:var(--text);border-radius:6px;padding:9px 13px;cursor:pointer;transition:all 0.2s ease}.filters button{min-width:160px;text-align:left}.filters button span{float:right}.filters label{display:flex;gap:9px;align-items:center;font-weight:500;cursor:pointer;transition:background 0.2s ease}.filters label.active{background:#143337;border-color:#1e5a6d}.filters label i{width:25px;height:14px;border-radius:20px;background:#263a43;position:relative;transition:background 0.2s ease}.filters label.active i{background:#54dfc2}.filters label i:after{content:'';position:absolute;width:10px;height:10px;left:2px;top:2px;border-radius:50%;background:#66848c;transition:all 0.2s ease}.filters label.active i:after{left:13px;background:#082328}.range-dropdown{position:relative;display:flex}.range-dropdown button{position:relative;z-index:100}.range-menu{position:absolute;top:calc(100% + 8px);left:0;background:var(--card);border:1px solid var(--border);border-radius:6px;min-width:160px;display:flex;flex-direction:column;gap:0;opacity:0;pointer-events:none;transform:translateY(-12px);transition:opacity 0.2s ease,transform 0.2s ease;z-index:1000;box-shadow:0 8px 24px rgba(0,0,0,0.3)}.range-menu.open{opacity:1;pointer-events:auto;transform:translateY(0)}.range-menu button{border:none;background:none;color:var(--text);padding:10px 13px;text-align:left;border-radius:0;font-size:13px;transition:background 0.15s ease;margin:0;cursor:pointer}.range-menu button:hover{background:#143337}.range-menu button:first-child{border-radius:6px 6px 0 0}.range-menu button:last-child{border-radius:0 0 6px 6px}.demo-banner{border-color:#245761;background:#10252b;z-index:1}.banner-icon{color:var(--cyan);font-size:20px}.demo-banner strong{color:var(--text)}.demo-banner button{margin-left:auto;background:none;border:none;color:var(--cyan);text-decoration:none;font-weight:700;cursor:pointer}.metric-grid{display:grid;grid-template-columns:repeat(6,minmax(130px,1fr));gap:12px}.metric-card,.panel{border:1px solid var(--border);background:var(--card);border-radius:10px}.metric-card{min-height:158px;padding:16px;position:relative;overflow:hidden}.metric-top{display:flex;justify-content:space-between;color:var(--muted);font-size:12px}.metric-top b{font-size:20px}.metric-card>strong{display:block;font-family:'Space Grotesk',sans-serif;font-size:28px;margin-top:18px}.metric-card small{position:absolute;right:14px;top:68px;color:var(--red);font-size:9px;font-weight:700}.metric-card small i{display:inline-block;width:6px;height:6px;background:var(--cyan);border-radius:50%;margin-right:4px}.metric-card p{color:#687782;font-size:10px;margin-top:14px}.sparkline{position:absolute;left:16px;right:16px;bottom:14px;width:calc(100% - 32px);height:25px}.data-status{color:#61717d;font-size:11px;margin-top:-8px}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}.main-grid,.bottom-grid{display:grid;grid-template-columns:2fr 1fr;gap:16px}.bottom-grid{grid-template-columns:1.4fr 1fr}.panel{padding:20px;min-width:0}.panel-heading{display:flex;justify-content:space-between;align-items:start}.panel h2{font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:500;margin:0}.panel p{color:var(--muted);font-size:11px;margin:6px 0 0}.panel-heading button,.panel-heading>a{border:1px solid #303942;background:#11171e;color:#aebbc3;border-radius:6px;padding:8px 10px;text-decoration:none;font-size:11px;cursor:pointer;transition:all 0.2s ease}.panel-heading button:disabled{opacity:0.5;cursor:not-allowed}.refresh-btn{border:none!important;background:none!important;color:#aebbc3!important;padding:8px!important;cursor:pointer}.refresh-btn:disabled{opacity:0.6}.legend{display:flex;gap:13px;align-items:center;color:var(--muted);font-size:10px;margin:20px 0 5px;flex-wrap:wrap}.legend button{padding:6px 10px;border:1px solid #303942;border-radius:4px;background:#11171e;color:var(--cyan);cursor:pointer;font-size:10px;font-weight:500;transition:all 0.15s ease;white-space:nowrap}.legend button:hover{background:#143337;border-color:#1e5a6d}.legend span{display:flex;align-items:center;gap:4px;white-space:nowrap}.dot{width:7px;height:7px;display:inline-block;border-radius:50%;margin-right:4px}.dot.cyan,.cyan-dot{background:var(--cyan)}.dot.red,.red-dot{background:var(--red)}.area-chart{width:100%;height:195px}.chart-container{position:relative;width:100%}.chart-container.loading{opacity:0.5;pointer-events:none}.loading-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(16,25,34,0.8);border-radius:8px;font-size:12px;color:var(--muted)}.loading-overlay span:before{content:'';display:inline-block;width:4px;height:4px;background:var(--cyan);border-radius:50%;margin-right:6px;animation:pulse 1.5s ease-in-out infinite}.grid-lines line{stroke:#273139;stroke-width:1}.donut{width:150px;height:150px;margin:20px auto 14px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--cyan) 0 68%,var(--red) 68% 84%,var(--purple) 84% 100%)}.donut:after{content:'';width:105px;height:105px;border-radius:50%;background:var(--card);position:absolute}.donut div{z-index:1;text-align:center}.donut strong{display:block;font:500 25px 'Space Grotesk'}.donut small{color:var(--muted);font-size:10px}.usage-list{display:grid;gap:11px;color:#a6b6be;font-size:11px}.usage-list span{display:flex;align-items:center;gap:7px}.usage-list i{width:7px;height:7px;border-radius:50%}.usage-list b{margin-left:auto;color:var(--text)}.purple-dot{background:var(--purple)}table{width:100%;border-collapse:collapse;margin-top:18px;font-size:12px}th{text-align:left;color:#63727d;font-size:10px;font-weight:500;padding:8px;border-bottom:1px solid var(--border)}td{padding:12px 8px;border-bottom:1px solid #202830;color:#b8c5cc}.method,.status{font-size:9px;font-weight:700;padding:4px 6px;border-radius:4px}.method.get{color:var(--cyan);background:#143337}.method.post{color:var(--purple);background:#28213e}.status.good{color:#5ed9bf;background:#14342f}.status.warn{color:var(--orange);background:#3a2c1b}.event{display:flex;gap:10px;align-items:start;padding:13px 0;border-bottom:1px solid #202830}.event-dot{width:7px;height:7px;border-radius:50%;background:#54dfc2;margin-top:5px}.event-dot.blocked{background:var(--red)}.event div{display:grid;gap:4px;min-width:0}.event strong{font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.event small,.event time{color:var(--muted);font-size:10px}.event time{margin-left:auto}.empty{padding-top:24px;color:var(--muted);font-size:12px}@media(max-width:1200px){.metric-grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:800px){.page-heading{align-items:start;flex-direction:column}.main-grid,.bottom-grid{grid-template-columns:1fr}.filters,.demo-banner{flex-wrap:wrap}.demo-banner button{margin-left:0}.metric-grid{grid-template-columns:repeat(2,1fr)}.range-menu{left:-40px}.range-menu.open{left:-40px}}@media(max-width:480px){.metric-grid{grid-template-columns:1fr}.page-heading h1{font-size:28px}table{font-size:10px}th:nth-child(2),td:nth-child(2){display:none}}`]
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
  readonly loading = signal(false);
  readonly comparisonEnabled = signal(false);
  readonly visibleSeries = signal({ allowed: true, blocked: true });
  
  summary: MetricsSummary | null = null;
  events: RateEventItem[] = [
    { id: 1, status: 'Blocked', reason: 'RATE_LIMIT_EXCEEDED', endpoint: 'POST /api/auth/login', ipAddress: '192.168.1.45', occurredAt: Date.now() - 60000 },
    { id: 2, status: 'Allowed', reason: 'REQUEST_ALLOWED', endpoint: 'GET /api/users', ipAddress: '10.0.0.12', occurredAt: Date.now() - 120000 },
    { id: 3, status: 'Blocked', reason: 'RATE_LIMIT_EXCEEDED', endpoint: 'POST /api/payments', ipAddress: '172.16.0.8', occurredAt: Date.now() - 180000 },
    { id: 4, status: 'Allowed', reason: 'REQUEST_ALLOWED', endpoint: 'GET /api/products', ipAddress: '192.168.1.99', occurredAt: Date.now() - 240000 }
  ];
  metrics: DashboardMetrics = { ...fallbackMetrics };
  
  readonly Activity = Activity;
  readonly ShieldCheck = ShieldCheck;
  readonly AlertTriangle = AlertTriangle;
  readonly Zap = Zap;
  readonly SlidersHorizontal = SlidersHorizontal;
  readonly KeyRound = KeyRound;

  ngOnInit(): void {
    this.loadMetrics();
    this.loadEvents();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isClickInsideDropdown = target.closest('.range-dropdown') !== null;
    if (!isClickInsideDropdown && this.rangeOpen()) {
      this.rangeOpen.set(false);
    }
  }

  private loadMetrics(): void {
    this.loading.set(true);
    this.metricsService.summary().subscribe({
      next: (summary) => {
        this.summary = summary;
        const total = summary.allowedRequests + summary.blockedRequests;
        this.metrics = {
          totalRequests: total,
          allowedRequests: summary.allowedRequests,
          blockedRequests: summary.blockedRequests,
          blockRate: total ? Math.round(summary.blockedRequests / total * 100) : 0,
          activePolicies: summary.totalPolicies,
          eventsTracked: total
        };
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private loadEvents(): void {
    this.eventService.list(0, 5).subscribe({ next: (response) => this.events = response.content });
  }

  toggleRange(event?: Event): void {
    event?.stopPropagation();
    this.rangeOpen.update((open) => !open);
  }

  selectRange(range: string, event: Event): void {
    event.stopPropagation();
    this.selectedRange.set(range);
    this.rangeOpen.set(false);
    this.loadMetrics();
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

  onConnectWorkspace(): void {
    this.toast.show('A ligar workspace...');
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
    if (this.refreshing() || this.loading()) return;
    this.refreshing.set(true);
    this.toast.show('A atualizar dados...');
    
    this.metricsService.summary().subscribe({
      next: () => {
        this.refreshing.set(false);
        this.toast.show('Dados atualizados');
      },
      error: () => {
        this.refreshing.set(false);
        this.toast.show('Erro ao atualizar dados');
      }
    });
  }
}