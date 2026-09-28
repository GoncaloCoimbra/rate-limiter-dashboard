import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Copy, LucideAngularModule, Power, SlidersHorizontal, Trash2 } from 'lucide-angular';
import { PolicyItem, PolicyService } from '../../services/policy.service';
import { ToastService } from '../../../shared/toast.service';

interface PolicyRow { id: number; name: string; algo: string; limit: string; scope: string; status: string; usage: number; }

@Component({
  selector: 'app-policy-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <section class="policies-page">
      <header class="page-header"><div><p>CONTROLO DE TRÁFEGO / POLÍTICAS</p><h1>Políticas</h1><span>Configure e gira as regras que protegem o tráfego da sua API.</span></div><button class="primary" (click)="createPolicy()" [disabled]="saving">＋ Criar política</button></header>
      <div class="summary-strip"><div><small>Políticas ativas</small><strong>{{ totalElements }}</strong></div><div><small>Utilização média</small><strong>68.4%</strong></div><div><small>Pedidos protegidos</small><strong>1.24M</strong></div><div><small>Última alteração</small><strong>12 min atrás</strong></div></div>
      <article class="panel"><div class="panel-heading"><div><h2>Políticas configuradas</h2><p>Regras ativas e pausadas do workspace</p></div><div class="tools"><label>⌕ <input placeholder="Pesquisar políticas..." /></label><button (click)="toast.show('Filtro de políticas')">⚙ Filtrar</button><button (click)="toast.show('Exportação de políticas')">⇩ Exportar</button></div></div>
        <p *ngIf="loading">A carregar políticas...</p>
        <table *ngIf="!loading"><thead><tr><th>Política</th><th>Algoritmo</th><th>Limite</th><th>Âmbito</th><th>Estado</th><th>Utilização</th><th>Ações</th></tr></thead><tbody><tr *ngFor="let policy of policies"><td><strong>{{ policy.name }}</strong><small>Proteção de tráfego</small></td><td>{{ policy.algo }}</td><td>{{ policy.limit }}</td><td>{{ policy.scope }}</td><td><span class="status" [class.paused]="policy.status === 'Paused'">{{ policy.status === 'Active' ? 'Ativa' : 'Pausada' }}</span></td><td><div class="usage"><span>{{ policy.usage }}%</span><i><em [style.width.%]="policy.usage"></em></i></div></td><td><div class="actions"><button aria-label="Editar" (click)="editPolicy(policy)"><lucide-icon [img]="SlidersHorizontal" size="15" /></button><button aria-label="Copiar" (click)="copyPolicy(policy)"><lucide-icon [img]="Copy" size="15" /></button><button aria-label="Ativar" (click)="togglePolicy(policy)"><lucide-icon [img]="Power" size="15" /></button><button aria-label="Eliminar" (click)="deletePolicy(policy)"><lucide-icon [img]="Trash2" size="15" /></button></div></td></tr></tbody></table>
        <nav class="pager" *ngIf="totalPages > 0" aria-label="Paginação de políticas"><button type="button" (click)="previousPage()" [disabled]="page === 0">Anterior</button><span>Página {{ page + 1 }} de {{ totalPages }} · {{ totalElements }} políticas</span><button type="button" (click)="nextPage()" [disabled]="page + 1 >= totalPages">Seguinte</button></nav>
      </article>
    </section>
  `,
  styles: [`:host{display:block}.policies-page{display:grid;gap:22px;max-width:1500px}.page-header{display:flex;align-items:end;justify-content:space-between;gap:24px}.page-header p{color:var(--cyan);font-size:10px;font-weight:800;letter-spacing:.14em;margin:0 0 9px}.page-header h1{font:500 34px 'Space Grotesk';margin:0}.page-header span{display:block;color:var(--muted);font-size:14px;margin-top:9px}.primary{border:0;border-radius:7px;background:var(--cyan);color:#06242a;font-weight:700;padding:13px 16px}.summary-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--border);border:1px solid var(--border);border-radius:10px;overflow:hidden}.summary-strip div{display:grid;gap:7px;padding:16px 18px;background:var(--card)}.summary-strip small{color:var(--muted);font-size:11px}.summary-strip strong{font:500 22px 'Space Grotesk'}.panel{border:1px solid var(--border);border-radius:10px;background:var(--card);padding:20px}.panel-heading{display:flex;justify-content:space-between;gap:15px;margin-bottom:18px}.panel h2{font:500 17px 'Space Grotesk';margin:0}.panel p{color:var(--muted);font-size:12px;margin:7px 0}.tools{display:flex;gap:7px}.tools button,.tools label{height:34px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);border-radius:6px;padding:0 10px;font-size:11px}.tools label{display:flex;align-items:center;gap:6px}.tools input{width:140px;border:0;outline:0;background:none;color:var(--text)}table{width:100%;border-collapse:collapse;font-size:12px}th{text-align:left;color:var(--muted);font-size:10px;text-transform:uppercase;padding:10px 8px;border-bottom:1px solid var(--border)}td{padding:14px 8px;color:var(--text);border-bottom:1px solid var(--border)}td:first-child{display:grid;gap:4px}td small{color:var(--muted);font-size:10px}.status{display:inline-block;color:#087f78;background:#d9f5ee;border-radius:4px;padding:4px 7px;font-size:9px}.status.paused{color:#8a5600;background:#fff1cf}.usage{display:flex;align-items:center;gap:8px}.usage i{width:70px;height:4px;background:var(--border);border-radius:4px;overflow:hidden}.usage em{display:block;height:100%;background:var(--cyan)}.actions{display:flex;gap:4px}.actions button{border:0;background:transparent;color:var(--muted);padding:5px}.pager{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-top:16px;color:var(--muted);font-size:12px}.pager button{border:1px solid var(--border);border-radius:7px;padding:8px 11px;background:var(--card);color:var(--text)}@media(max-width:700px){.page-header,.panel-heading{align-items:start;flex-direction:column}.summary-strip{grid-template-columns:repeat(2,1fr)}.tools{width:100%;flex-wrap:wrap}.pager{font-size:11px}}`]
})
export class PolicyListComponent implements OnInit {
  readonly toast = inject(ToastService);
  private readonly policyService = inject(PolicyService);
  readonly SlidersHorizontal = SlidersHorizontal;
  readonly Copy = Copy;
  readonly Power = Power;
  readonly Trash2 = Trash2;
  policies: PolicyRow[] = [];
  page = 0;
  totalPages = 0;
  totalElements = 0;
  readonly pageSize = 10;
  loading = true;
  saving = false;

  ngOnInit(): void { this.loadPage(); }
  loadPage(): void {
    this.loading = true;
    this.policyService.list(this.page, this.pageSize).subscribe({
      next: response => { this.policies = response.content.map(policy => this.toRow(policy)); this.totalPages = response.totalPages; this.totalElements = response.totalElements; this.loading = false; },
      error: () => { this.policies = []; this.loading = false; this.toast.show('Não foi possível carregar as políticas'); }
    });
  }
  previousPage(): void { if (this.page > 0) { this.page--; this.loadPage(); } }
  nextPage(): void { if (this.page + 1 < this.totalPages) { this.page++; this.loadPage(); } }
  createPolicy(): void {
    const name = `Nova política ${this.policies.length + 1}`;
    this.saving = true;
    this.policyService.create({ name, description: 'Proteção de tráfego', algorithm: 'TOKEN_BUCKET', limit: 100, window: 'MINUTE', scope: 'IP_ADDRESS', status: 'ACTIVE', usage: 0, environment: 'PRODUCTION', burst: 0 }).subscribe({
      next: () => { this.saving = false; this.toast.show('Política criada'); this.loadPage(); },
      error: () => { this.saving = false; this.toast.show('Não foi possível criar a política'); }
    });
  }
  editPolicy(policy: PolicyRow): void {
    const nextName = `${policy.name} (editada)`;
    this.policyService.update(policy.id, { name: nextName }).subscribe({ next: () => { this.toast.show('Política atualizada'); this.loadPage(); }, error: () => this.toast.show('Não foi possível atualizar a política') });
  }
  copyPolicy(policy: PolicyRow): void {
    this.policyService.create({ name: `${policy.name} (cópia)`, description: 'Proteção de tráfego', algorithm: policy.algo, limit: Number(policy.limit), window: 'MINUTE', scope: 'IP_ADDRESS', status: 'ACTIVE', usage: 0, environment: 'PRODUCTION', burst: 0 }).subscribe({ next: () => { this.toast.show('Política copiada'); this.loadPage(); }, error: () => this.toast.show('Não foi possível copiar a política') });
  }
  togglePolicy(policy: PolicyRow): void {
    const status = policy.status === 'Active' ? 'PAUSED' : 'ACTIVE';
    this.policyService.update(policy.id, { status }).subscribe({ next: () => { this.toast.show('Estado da política atualizado'); this.loadPage(); }, error: () => this.toast.show('Não foi possível atualizar o estado') });
  }
  deletePolicy(policy: PolicyRow): void {
    this.policyService.delete(policy.id).subscribe({ next: () => { this.toast.show('Política eliminada'); this.loadPage(); }, error: () => this.toast.show('Não foi possível eliminar a política') });
  }
  private toRow(policy: PolicyItem): PolicyRow { return { id: policy.id, name: policy.name, algo: policy.algorithm, limit: String(policy.limit), scope: policy.scope ?? '—', status: policy.status, usage: 0 }; }
}
