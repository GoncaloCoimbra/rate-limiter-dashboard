import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Activity, LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { PolicyItem, PolicyService } from '../../../policies/services/policy.service';
import { TranslationService } from '../../../shared/translation.service';
import { SimulatorService, SimulatorResult } from '../../services/simulator.service';

@Component({
  selector: 'app-simulator-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  template: `
    <section class="simulator-page">
      <header class="simulator-header">
        <span class="simulator-mark" aria-hidden="true"><lucide-icon [img]="Activity" size="21" /></span>
        <div>
          <p>{{ i18n.translate('traffic') }}</p>
          <h1>{{ i18n.translate('simulator') }}</h1>
          <span>{{ i18n.translate('simulatorDescription') }}</span>
        </div>
      </header>

      <p *ngIf="loadingPolicies" class="simulator-state" role="status">{{ i18n.translate('loadingData') }}</p>
      <div *ngIf="error" class="simulator-state error" role="alert">{{ error }}</div>
      <div *ngIf="!loadingPolicies && !error && !policies.length" class="simulator-state empty">
        <strong>{{ i18n.translate('simulatorNoPolicies') }}</strong>
        <a routerLink="/policies" class="primary-button">{{ i18n.translate('createPolicy') }}</a>
      </div>

      <form *ngIf="!loadingPolicies && policies.length" class="simulator-panel" (ngSubmit)="simulate()">
        <div class="simulator-fields">
          <label for="simulator-policy">{{ i18n.translate('policyColumn') }}
            <select id="simulator-policy" name="policy" [(ngModel)]="policyId" required>
              <option *ngFor="let policy of policies" [ngValue]="policy.id">{{ policy.name }} · {{ policy.limit }} / {{ windowLabel(policy.window) }}</option>
            </select>
          </label>
          <label for="simulator-count">{{ i18n.translate('simulatorRequestCount') }}
            <input id="simulator-count" name="requestCount" type="number" [(ngModel)]="requestCount" min="1" max="20" required />
          </label>
        </div>
        <p>{{ i18n.translate('simulatorDescriptionHint') }}</p>
        <button type="submit" class="primary-button" [disabled]="simulating || policyId === null">
          {{ simulating ? i18n.translate('simulatorRunning') : i18n.translate('simulatorRun') }}
        </button>
      </form>

      <section *ngIf="results.length" class="simulator-results" aria-live="polite">
        <h2>{{ i18n.translate('simulatorResults') }}</h2>
        <div class="result-counts">
          <div><span>{{ i18n.translate('allowed') }}</span><strong>{{ allowedCount }}</strong></div>
          <div><span>{{ i18n.translate('blocked') }}</span><strong>{{ blockedCount }}</strong></div>
        </div>
        <p>{{ i18n.translate('simulatorDashboardHint') }}</p>
        <a routerLink="/" class="dashboard-link">{{ i18n.translate('dashboard') }} →</a>
      </section>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .simulator-page { display: grid; gap: 20px; max-width: 920px; }
    .simulator-header { display: flex; align-items: center; gap: 15px; padding: 22px 24px; border: 1px solid var(--border); border-radius: 14px; background: linear-gradient(120deg, var(--card), rgba(53, 200, 207, .06)); }
    .simulator-mark { display: grid; place-items: center; width: 48px; height: 48px; flex: 0 0 48px; border: 1px solid rgba(53, 200, 207, .28); border-radius: 12px; background: rgba(53, 200, 207, .1); color: var(--cyan); }
    .simulator-header p { color: var(--cyan); font-size: 10px; font-weight: 800; margin: 0 0 7px; }
    .simulator-header h1 { font: 500 28px 'Space Grotesk'; margin: 0; }
    .simulator-header > div > span { display: block; color: var(--muted); font-size: 13px; margin-top: 6px; }
    .simulator-panel, .simulator-results { display: grid; gap: 16px; padding: 22px; border: 1px solid var(--border); border-radius: 12px; background: var(--card); }
    .simulator-fields { display: grid; grid-template-columns: minmax(0, 1fr) 180px; gap: 14px; }
    .simulator-fields label { display: grid; gap: 7px; color: var(--muted); font-size: 12px; }
    .simulator-fields input, .simulator-fields select { width: 100%; min-height: 42px; padding: 0 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--input-bg); color: var(--text); }
    .simulator-panel > p, .simulator-results > p { color: var(--muted); font-size: 12px; line-height: 1.55; margin: 0; }
    .simulator-panel .primary-button { justify-self: start; }
    .simulator-results h2 { font: 500 18px 'Space Grotesk'; margin: 0; }
    .result-counts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .result-counts div { display: grid; gap: 6px; padding: 14px; border: 1px solid var(--border); border-radius: 8px; background: var(--input-bg); }
    .result-counts span { color: var(--muted); font-size: 12px; }
    .result-counts strong { font: 500 24px 'Space Grotesk'; }
    .dashboard-link { color: var(--cyan); font-size: 13px; font-weight: 700; text-decoration: none; }
    .simulator-state { padding: 18px; border: 1px solid var(--border); border-radius: 10px; background: var(--card); color: var(--muted); }
    .simulator-state.empty { display: grid; gap: 12px; justify-items: start; }
    .simulator-state.error { color: var(--red); }
    @media (max-width: 620px) { .simulator-fields { grid-template-columns: 1fr; } .simulator-header { align-items: flex-start; padding: 18px; } }
  `]
})
export class SimulatorPageComponent implements OnInit {
  private readonly simulatorService = inject(SimulatorService);
  private readonly policyService = inject(PolicyService);
  readonly i18n = inject(TranslationService);
  readonly Activity = Activity;
  policies: PolicyItem[] = [];
  policyId: number | null = null;
  requestCount = 8;
  results: SimulatorResult[] = [];
  loadingPolicies = true;
  simulating = false;
  error: string | null = null;

  get allowedCount(): number { return this.results.filter((result) => result.allowed).length; }
  get blockedCount(): number { return this.results.filter((result) => !result.allowed).length; }

  ngOnInit(): void {
    this.policyService.list(0, 100).subscribe({
      next: (response) => {
        this.policies = response.content.filter((policy) => policy.status === 'ACTIVE');
        this.policyId = this.policies[0]?.id ?? null;
        this.loadingPolicies = false;
      },
      error: () => {
        this.error = this.i18n.translate('simulatorLoadPoliciesFailed');
        this.loadingPolicies = false;
      }
    });
  }

  async simulate(): Promise<void> {
    if (this.policyId === null || this.simulating) return;
    this.simulating = true;
    this.error = null;
    this.results = [];
    const count = Math.min(20, Math.max(1, Math.floor(Number(this.requestCount) || 1)));
    this.requestCount = count;

    try {
      for (let index = 0; index < count; index++) {
        this.results.push(await firstValueFrom(this.simulatorService.evaluate(this.policyId)));
      }
    } catch {
      this.error = this.i18n.translate('simulatorRequestFailed');
    } finally {
      this.simulating = false;
    }
  }

  windowLabel(window: string): string {
    const key = { SECOND: 'perSecond', MINUTE: 'perMinute', HOUR: 'perHour', DAY: 'perDay' }[window as 'SECOND' | 'MINUTE' | 'HOUR' | 'DAY'];
    return key ? this.i18n.translate(key) : window;
  }
}