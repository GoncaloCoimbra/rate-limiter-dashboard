import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { PolicyItem, PolicyService } from '../policies/services/policy.service';
import { TranslationService } from '../shared/translation.service';

@Component({
  selector: 'app-rate-limits',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="limits-page">
      <header class="page-header">
        <div>
          <p>{{ i18n.translate('traffic') }}</p>
          <h1>{{ i18n.translate('limitsTitle') }}</h1>
          <span>{{ i18n.translate('limitsDescription') }}</span>
        </div>
      </header>

      <div class="panel loading" *ngIf="loading" role="status" aria-live="polite">
        <strong>{{ i18n.translate('loadingLimits') }}</strong>
        <p>{{ i18n.translate('syncingPolicies') }}</p>
      </div>

      <div class="panel error" *ngIf="error" role="alert">
        <strong>{{ i18n.translate('failedLimits') }}</strong>
        <p>{{ error }}</p>
      </div>

      <article class="panel" *ngIf="!loading && !error">
        <div class="panel-heading">
          <div>
            <h2>{{ i18n.translate('activeLimiters') }}</h2>
            <p>{{ i18n.translate('activeRulesHint') }}</p>
          </div>
        </div>

        <table *ngIf="policies.length; else emptyState">
          <thead>
            <tr>
              <th>{{ i18n.translate('policyColumn') }}</th>
              <th>{{ i18n.translate('algorithm') }}</th>
              <th>{{ i18n.translate('requestLimit') }}</th>
              <th>{{ i18n.translate('window') }}</th>
              <th>{{ i18n.translate('scope') }}</th>
              <th>{{ i18n.translate('status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let policy of policies">
              <td>{{ policy.name }}</td>
              <td>{{ algorithmLabel(policy.algorithm) }}</td>
              <td>{{ policy.limit }}</td>
              <td>{{ windowLabel(policy.window) }}</td>
              <td>{{ policy.scope ?? '—' }}</td>
              <td>
                <span class="status" [class.active]="policy.status === 'ACTIVE' || policy.status === 'Active'" [class.paused]="policy.status === 'PAUSED' || policy.status === 'Paused'">
                  {{ i18n.translate(policy.status === 'ACTIVE' || policy.status === 'Active' ? 'active' : 'paused') }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <ng-template #emptyState>
          <div class="empty-state">
            <strong>{{ i18n.translate('noConfiguredLimits') }}</strong>
            <p>{{ i18n.translate('noActivePolicies') }}</p>
          </div>
        </ng-template>
      </article>
    </section>
  `,
  styles: [`.limits-page{display:grid;gap:22px;max-width:1500px}.page-header p{color:var(--cyan);font-size:10px;font-weight:800;letter-spacing:.14em;margin:0 0 9px}.page-header h1{font:500 34px 'Space Grotesk';margin:0}.page-header span{display:block;color:var(--muted);font-size:14px;margin-top:9px}.panel{border:1px solid var(--border);border-radius:10px;background:var(--card);padding:20px}.panel.loading,.panel.error{display:grid;gap:6px;align-content:center;min-height:180px}.panel p{color:var(--muted);font-size:12px;margin:8px 0 0}.panel strong{font-size:16px}.panel-heading{margin-bottom:18px}.panel h2{font:500 17px 'Space Grotesk';margin:0}.status{display:inline-flex;align-items:center;padding:6px 10px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:.04em}.status.active{background:rgba(94,217,191,.12);color:#5ed9bf}.status.paused{background:rgba(247,165,74,.12);color:var(--orange)}table{width:100%;border-collapse:collapse;font-size:12px}th{text-align:left;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.05em;padding:0 10px 10px}td{padding:14px 10px;border-top:1px solid var(--border);color:var(--text)}.empty-state{padding:34px 12px;border:1px dashed var(--border);border-radius:10px;color:var(--muted);text-align:center}.empty-state strong{display:block;color:var(--text);margin-bottom:8px}`]
})
export class RateLimitsComponent implements OnInit {
  readonly i18n = inject(TranslationService);
  private readonly policyService = inject(PolicyService);

  policies: PolicyItem[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadPolicies();
  }

  private loadPolicies(): void {
    this.loading = true;
    this.error = null;

    this.policyService.list(0, 10).subscribe({
      next: (response) => {
        this.policies = response.content;
        this.loading = false;
      },
      error: () => {
        this.policies = [];
        this.loading = false;
        this.error = this.i18n.translate('limitsLoadError');
      }
    });
  }

  algorithmLabel(algorithm: string): string {
    const key = { FIXED_WINDOW: 'fixedWindow', TOKEN_BUCKET: 'tokenBucket', SLIDING_WINDOW: 'slidingWindow' }[algorithm as 'FIXED_WINDOW' | 'TOKEN_BUCKET' | 'SLIDING_WINDOW'];
    return key ? this.i18n.translate(key) : algorithm;
  }

  windowLabel(window: string): string {
    const key = { SECOND: 'perSecond', MINUTE: 'perMinute', HOUR: 'perHour', DAY: 'perDay' }[window as 'SECOND' | 'MINUTE' | 'HOUR' | 'DAY'];
    return key ? this.i18n.translate(key) : window;
  }
}

