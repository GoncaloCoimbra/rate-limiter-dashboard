import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { PolicyItem, PolicyService } from '../policies/services/policy.service';

@Component({
  selector: 'app-rate-limits',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="limits-page">
      <header class="page-header">
        <div>
          <p>CONTROLO DE TRÁFEGO</p>
          <h1>Rate limits</h1>
          <span>Políticas ativas configuradas para proteger os recursos do workspace.</span>
        </div>
      </header>

      <div class="panel loading" *ngIf="loading" role="status" aria-live="polite">
        <strong>A carregar rate limits</strong>
        <p>Estamos a sincronizar as políticas ativas do backend.</p>
      </div>

      <div class="panel error" *ngIf="error" role="alert">
        <strong>Não foi possível carregar os rate limits</strong>
        <p>{{ error }}</p>
      </div>

      <article class="panel" *ngIf="!loading && !error">
        <div class="panel-heading">
          <div>
            <h2>Limitadores ativos</h2>
            <p>Regra por regra em vigor neste workspace.</p>
          </div>
        </div>

        <table *ngIf="policies.length; else emptyState">
          <thead>
            <tr>
              <th>Política</th>
              <th>Algoritmo</th>
              <th>Limite</th>
              <th>Janela</th>
              <th>Âmbito</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let policy of policies">
              <td>{{ policy.name }}</td>
              <td>{{ policy.algorithm }}</td>
              <td>{{ policy.limit }}</td>
              <td>{{ policy.window }}</td>
              <td>{{ policy.scope ?? '—' }}</td>
              <td>
                <span class="status" [class.active]="policy.status === 'ACTIVE' || policy.status === 'Active'" [class.paused]="policy.status === 'PAUSED' || policy.status === 'Paused'">
                  {{ policy.status === 'ACTIVE' || policy.status === 'Active' ? 'Ativa' : 'Pausada' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <ng-template #emptyState>
          <div class="empty-state">
            <strong>Sem rate limits configurados</strong>
            <p>Não existem políticas ativas para mostrar neste workspace.</p>
          </div>
        </ng-template>
      </article>
    </section>
  `,
  styles: [`.limits-page{display:grid;gap:22px;max-width:1500px}.page-header p{color:var(--cyan);font-size:10px;font-weight:800;letter-spacing:.14em;margin:0 0 9px}.page-header h1{font:500 34px 'Space Grotesk';margin:0}.page-header span{display:block;color:var(--muted);font-size:14px;margin-top:9px}.panel{border:1px solid var(--border);border-radius:10px;background:var(--card);padding:20px}.panel.loading,.panel.error{display:grid;gap:6px;align-content:center;min-height:180px}.panel p{color:var(--muted);font-size:12px;margin:8px 0 0}.panel strong{font-size:16px}.panel-heading{margin-bottom:18px}.panel h2{font:500 17px 'Space Grotesk';margin:0}.status{display:inline-flex;align-items:center;padding:6px 10px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:.04em}.status.active{background:rgba(94,217,191,.12);color:#5ed9bf}.status.paused{background:rgba(247,165,74,.12);color:var(--orange)}table{width:100%;border-collapse:collapse;font-size:12px}th{text-align:left;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.05em;padding:0 10px 10px}td{padding:14px 10px;border-top:1px solid var(--border);color:var(--text)}.empty-state{padding:34px 12px;border:1px dashed var(--border);border-radius:10px;color:var(--muted);text-align:center}.empty-state strong{display:block;color:var(--text);margin-bottom:8px}`]
})
export class RateLimitsComponent implements OnInit {
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
        this.error = 'Não foi possível carregar as políticas do backend.';
      }
    });
  }
}

