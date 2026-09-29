import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { Activity, AlertTriangle, BookOpen, KeyRound, LucideAngularModule, ShieldCheck, SlidersHorizontal, Zap } from 'lucide-angular';
import { EndpointActivity, MetricsComparison, MetricsService, MetricsSummary, TrafficBucket } from '../metrics/services/metrics.service';
import { EventService, RateEventItem } from '../events/services/event.service';
import { TranslationService } from '../shared/translation.service';
import { ToastService } from '../shared/toast.service';

interface DashboardMetrics { totalRequests: number; allowedRequests: number; blockedRequests: number; blockRate: number; activePolicies: number; eventsTracked: number; }
type DashboardRange = 'lastHour' | 'lastSixHours' | 'today';

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
        <button class="primary-button" (click)="createPolicy($event)">{{ i18n.translate('createPolicy') }}</button>
      </header>

      <div class="filters surface-card">
        <strong>◷ &nbsp; {{ i18n.translate('dateRange') }}</strong>
        <div class="range-dropdown">
          <button type="button" (click)="toggleRange($event)" [attr.aria-expanded]="rangeOpen()">{{ i18n.translate(selectedRange()) }} <span>⌄</span></button>
          <div class="range-menu" [class.open]="rangeOpen()" role="menu">
            <button type="button" role="menuitemradio" [attr.aria-checked]="selectedRange() === 'lastHour'" (click)="selectRange('lastHour', $event)">{{ i18n.translate('lastHour') }}</button>
            <button type="button" role="menuitemradio" [attr.aria-checked]="selectedRange() === 'lastSixHours'" (click)="selectRange('lastSixHours', $event)">{{ i18n.translate('lastSixHours') }}</button>
            <button type="button" role="menuitemradio" [attr.aria-checked]="selectedRange() === 'today'" (click)="selectRange('today', $event)">{{ i18n.translate('today') }}</button>
          </div>
        </div>
        <button type="button" class="compare-toggle" role="switch" [attr.aria-checked]="comparisonEnabled()" (click)="toggleComparison($event)" [class.active]="comparisonEnabled()"><i aria-hidden="true"></i>{{ i18n.translate('compare') }}</button>
      </div>

      <div class="data-state loading" *ngIf="state() === 'loading'" role="status" aria-live="polite">
        <span class="state-icon" aria-hidden="true"><span class="state-pulse"></span></span>
        <div>
          <strong>{{ i18n.translate('loadingMetrics') }}</strong>
          <p>{{ i18n.translate('loadingMetricsHint') }}</p>
        </div>
      </div>

      <div class="data-state error" *ngIf="state() === 'error'" role="alert">
        <span class="state-icon" aria-hidden="true">!</span>
        <div>
          <strong>{{ i18n.translate('metricsErrorTitle') }}</strong>
          <p>{{ i18n.translate('metricsErrorHint') }}</p>
        </div>
        <button type="button" class="secondary-button" (click)="loadDashboard()">{{ i18n.translate('retry') }}</button>
      </div>

      <div class="data-state empty" *ngIf="state() === 'empty'">
        <span class="state-icon" aria-hidden="true">◎</span>
        <div>
          <strong>{{ i18n.translate('noEventsTitle') }}</strong>
          <p>{{ i18n.translate('noEventsHint') }}</p>
        </div>
        <a routerLink="/documentacao" class="secondary-button"><lucide-icon [img]="BookOpen" size="16" aria-hidden="true" />{{ i18n.translate('dashboardHelpAction') }}</a>
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
              <h2>{{ i18n.translate('trafficOverTime') }}</h2>
              <p>{{ i18n.translate('trafficRangeHint', { range: i18n.translate(selectedRange()) }) }}</p>
            </div>
            <div class="chart-legend" [attr.aria-label]="i18n.translate('seriesLegend')">
              <button type="button" [class.inactive]="!visibleSeries().allowed" [attr.aria-pressed]="visibleSeries().allowed" (click)="toggleSeries('allowed')"><i class="legend-allowed"></i>{{ i18n.translate('allowed') }}</button>
              <button type="button" [class.inactive]="!visibleSeries().blocked" [attr.aria-pressed]="visibleSeries().blocked" (click)="toggleSeries('blocked')"><i class="legend-blocked"></i>{{ i18n.translate('blocked') }}</button>
            </div>
          </div>
          <div class="traffic-chart" *ngIf="traffic.length; else noTraffic" role="img" [attr.aria-label]="i18n.translate('trafficChartLabel', { range: i18n.translate(selectedRange()), count: traffic.length })">
            <div class="bar-column" *ngFor="let bucket of traffic">
              <div class="bar-stack">
                <span *ngIf="visibleSeries().allowed" class="traffic-bar allowed" [style.height.%]="barHeight(bucket.allowedRequests)" [attr.title]="i18n.translate('allowedTooltip', { count: bucket.allowedRequests })"></span>
                <span *ngIf="visibleSeries().blocked" class="traffic-bar blocked" [style.height.%]="barHeight(bucket.blockedRequests)" [attr.title]="i18n.translate('blockedTooltip', { count: bucket.blockedRequests })"></span>
              </div>
              <small>{{ bucket.bucketStart | date:'HH:mm' }}</small>
            </div>
          </div>
          <ng-template #noTraffic><div class="empty">{{ i18n.translate('noTraffic') }}</div></ng-template>
        </article>

        <article class="panel usage">
          <div class="panel-heading">
            <div>
              <h2>{{ i18n.translate('decisionsPeriod') }}</h2>
              <p *ngIf="comparison() as compared">{{ comparisonSummary(compared) }}</p>
              <p *ngIf="!comparison()">{{ i18n.translate('decisionDistribution') }}</p>
            </div>
            <button type="button" class="refresh-btn" (click)="refreshUsage()" [disabled]="refreshing() || state() === 'loading'" [attr.aria-label]="i18n.translate('refreshMetrics')">⟳</button>
          </div>
          <div class="decision-row"><span>{{ i18n.translate('allowed') }}</span><strong>{{ metrics?.allowedRequests ?? 0 }}</strong></div>
          <div class="decision-track"><i class="decision-allowed" [style.width.%]="decisionPercentage(metrics?.allowedRequests ?? 0)"></i></div>
          <div class="decision-row"><span>{{ i18n.translate('blocked') }}</span><strong>{{ metrics?.blockedRequests ?? 0 }}</strong></div>
          <div class="decision-track"><i class="decision-blocked" [style.width.%]="decisionPercentage(metrics?.blockedRequests ?? 0)"></i></div>
        </article>
      </div>

      <div class="bottom-grid" *ngIf="state() === 'success'">
        <article class="panel table-panel">
          <div class="panel-heading">
            <div>
              <h2>{{ i18n.translate('topEndpoints') }}</h2>
              <p>{{ i18n.translate('topEndpointsHint') }}</p>
            </div>
            <a routerLink="/endpoints">{{ i18n.translate('viewAll') }} ›</a>
          </div>
          <div class="endpoint-row" *ngFor="let endpoint of endpointActivity">
            <code>{{ endpoint.endpoint }}</code>
            <strong>{{ endpoint.requestCount }}</strong>
            <small>{{ endpoint.blockedRequests }} {{ i18n.translate('blocked').toLowerCase() }}</small>
          </div>
          <div class="empty" *ngIf="!endpointActivity.length">{{ i18n.translate('noEndpoints') }}</div>
        </article>

        <article class="panel events">
          <div class="panel-heading">
            <div>
              <h2>{{ i18n.translate('recentEvents') }}</h2>
              <p>{{ i18n.translate('latestRateDecisions') }}</p>
            </div>
            <a routerLink="/logs">{{ i18n.translate('logs') }} ›</a>
          </div>
          <div class="event" *ngFor="let event of events">
            <span class="event-dot" [class.blocked]="event.status.toLowerCase() === 'blocked'"></span>
            <div>
              <strong>{{ i18n.translate(event.status.toLowerCase() === 'blocked' ? 'eventBlocked' : 'eventAllowed') }}</strong>
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
      padding: 6px 4px 0;
    }

    .page-heading {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      padding: 24px 26px;
      background: linear-gradient(135deg, rgba(17, 23, 30, 0.96), rgba(22, 27, 34, 0.9));
      border-color: rgba(117, 145, 168, 0.22);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.03), 0 18px 24px rgba(0,0,0,0.18);
      border-radius: 18px;
    }

    .page-heading > div {
      min-width: 0;
      flex: 1 1 auto;
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
      white-space: nowrap;
      margin-left: auto;
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
      border: 1px solid rgba(117, 145, 168, 0.2);
      background: linear-gradient(180deg, rgba(22,27,34,0.94), rgba(17,23,30,0.86));
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 18px;
      color: var(--muted);
      font-size: 13px;
      position: relative;
      z-index: 10;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
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

    .filters .compare-toggle { display:flex; align-items:center; gap:9px; font-weight:500; }
    .compare-toggle i { width:25px; height:14px; border-radius:20px; background:#263a43; position:relative; transition:background .2s ease; }
    .compare-toggle i::after { content:''; position:absolute; width:10px; height:10px; left:2px; top:2px; border-radius:50%; background:#fff; transition:transform .2s ease; }
    .compare-toggle.active i { background:#54dfc2; }
    .compare-toggle.active i::after { transform:translateX(11px); background:#082328; }

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
      border: 1px solid rgba(117, 145, 168, 0.18);
      background: linear-gradient(180deg, rgba(22,27,34,0.96), rgba(16,22,29,0.9));
      border-radius: 12px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.03), 0 12px 18px rgba(2, 6, 23, 0.16);
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .metric-card:hover {
      transform: translateY(-2px);
      border-color: rgba(53, 200, 207, 0.25);
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
      border: 1px solid rgba(117, 145, 168, 0.18);
      background: linear-gradient(180deg, rgba(22,27,34,0.96), rgba(16,22,29,0.9));
      border-radius: 12px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.03), 0 10px 18px rgba(2, 6, 23, 0.12);
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

    .chart-legend { display:flex; gap:8px; }
    .chart-legend button { display:flex; align-items:center; gap:6px; border:0; background:none; color:var(--muted); font-size:11px; cursor:pointer; }
    .chart-legend button.inactive { opacity:.45; }
    .chart-legend i { width:8px; height:8px; border-radius:50%; }
    .legend-allowed,.decision-allowed { background:var(--cyan); }
    .legend-blocked,.decision-blocked { background:var(--red); }
    .traffic-chart { display:grid; grid-template-columns:repeat(24,minmax(12px,1fr)); gap:5px; min-width:420px; height:158px; align-items:end; padding-top:14px; }
    .traffic { overflow:hidden; }
    .traffic .panel-heading { min-height:36px; }
    .bar-column { display:flex; min-width:0; height:100%; flex-direction:column; align-items:center; justify-content:end; gap:6px; }
    .bar-stack { display:flex; align-items:end; justify-content:center; gap:2px; height:128px; width:100%; }
    .traffic-bar { display:block; width:min(9px,45%); min-height:0; border-radius:3px 3px 0 0; transition:height .2s ease; }
    .traffic-bar.allowed { background:var(--cyan); }
    .traffic-bar.blocked { background:var(--red); }
    .bar-column small { color:var(--muted); font-size:9px; white-space:nowrap; }
    .decision-row { display:flex; justify-content:space-between; color:var(--muted); font-size:12px; margin:18px 0 7px; }
    .decision-row strong { color:var(--text); }
    .decision-track { height:6px; overflow:hidden; border-radius:4px; background:var(--border); }
    .decision-track i { display:block; height:100%; border-radius:inherit; transition:width .2s ease; }
    .endpoint-row { display:grid; grid-template-columns:minmax(0,1fr) auto auto; align-items:center; gap:12px; padding:13px 0; border-bottom:1px solid var(--border); }
    .endpoint-row:last-of-type { border-bottom:0; }
    .endpoint-row code { overflow:hidden; color:var(--text); font-size:11px; text-overflow:ellipsis; white-space:nowrap; }
    .endpoint-row strong { font-size:12px; }
    .endpoint-row small { color:var(--muted); font-size:10px; }

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
      .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }

    @media (max-width: 480px) {
      .metric-grid { grid-template-columns: 1fr; }
      .page-heading h1 { font-size: 28px; }
      .endpoint-row { grid-template-columns:minmax(0,1fr) auto; }
      .endpoint-row small { grid-column:1/-1; }
      .chart-legend { gap:2px; }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration:.01ms !important; animation-iteration-count:1 !important; scroll-behavior:auto !important; transition-duration:.01ms !important; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  readonly BookOpen = BookOpen;
  readonly i18n = inject(TranslationService);
  readonly toast = inject(ToastService);
  private readonly metricsService = inject(MetricsService);
  private readonly eventService = inject(EventService);
  private readonly router = inject(Router);

  readonly rangeOpen = signal(false);
  readonly selectedRange = signal<DashboardRange>('lastHour');
  readonly refreshing = signal(false);
  readonly state = signal<'loading' | 'empty' | 'error' | 'success'>('loading');
  readonly comparisonEnabled = signal(false);
  readonly visibleSeries = signal({ allowed: true, blocked: true });
  readonly comparison = signal<MetricsComparison | null>(null);

  summary: MetricsSummary | null = null;
  events: RateEventItem[] = [];
  metrics: DashboardMetrics | null = null;
  traffic: TrafficBucket[] = [];
  endpointActivity: EndpointActivity[] = [];

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

  loadDashboard(refresh = false): void {
    if (!refresh) this.state.set('loading');
    const { from, to } = this.rangeBounds();
    const duration = to - from;
    const previousFrom = from - duration;
    const comparisonRequest = this.comparisonEnabled()
      ? this.metricsService.comparison(from, to, previousFrom, from)
      : of(null);

    forkJoin({
      summary: this.metricsService.summary(from, to),
      events: this.eventService.list(0, 5),
      traffic: this.metricsService.trafficSeries(from, to),
      endpoints: this.metricsService.endpointActivity(from, to),
      comparison: comparisonRequest
    }).subscribe({
      next: ({ summary, events, traffic, endpoints, comparison }) => {
        this.summary = summary;
        this.events = events.content;
        this.traffic = traffic;
        this.endpointActivity = endpoints;
        this.comparison.set(comparison);
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
      },
      error: () => {
        this.summary = null;
        this.metrics = null;
        this.events = [];
        this.traffic = [];
        this.endpointActivity = [];
        this.comparison.set(null);
        this.state.set('error');
        this.refreshing.set(false);
      }
    });
  }

  private rangeBounds(): { from: number; to: number } {
    const to = Date.now();
    if (this.selectedRange() === 'today') {
      const startOfDay = new Date(to);
      startOfDay.setHours(0, 0, 0, 0);
      return { from: startOfDay.getTime(), to };
    }
    const duration = this.selectedRange() === 'lastSixHours' ? 6 * 60 * 60 * 1000 : 60 * 60 * 1000;
    return { from: to - duration, to };
  }

  comparisonSummary(comparison: MetricsComparison): string {
    const locale = { pt: 'pt-PT', en: 'en-GB', zh: 'zh-CN' }[this.i18n.locale()];
    const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
    const delta = `${comparison.delta > 0 ? '+' : ''}${format.format(comparison.delta)}`;
    return this.i18n.translate('allowRate', {
      rate: format.format(comparison.current.averageRate),
      delta,
    });
  }

  barHeight(value: number): number {
    const maxValue = Math.max(1, ...this.traffic.map((bucket) => bucket.allowedRequests + bucket.blockedRequests));
    return value === 0 ? 0 : Math.max(4, value / maxValue * 100);
  }

  decisionPercentage(value: number): number {
    const total = this.metrics?.totalRequests ?? 0;
    return total === 0 ? 0 : value / total * 100;
  }

  toggleRange(event?: Event): void {
    event?.stopPropagation();
    this.rangeOpen.update((open) => !open);
  }

  selectRange(range: DashboardRange, event: Event): void {
    event.stopPropagation();
    this.selectedRange.set(range);
    this.rangeOpen.set(false);
    this.loadDashboard();
    this.toast.show(`${this.i18n.translate('dateRange')}: ${this.i18n.translate(range)}`);
  }

  toggleComparison(event: Event): void {
    event.stopPropagation();
    this.comparisonEnabled.update((enabled) => !enabled);
    this.loadDashboard();
    this.toast.show(this.i18n.translate(this.comparisonEnabled() ? 'compareEnabled' : 'compareDisabled'));
  }

  toggleSeries(series: 'allowed' | 'blocked'): void {
    this.visibleSeries.update((visible) => ({ ...visible, [series]: !visible[series] }));
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
    this.loadDashboard(true);
  }
}
