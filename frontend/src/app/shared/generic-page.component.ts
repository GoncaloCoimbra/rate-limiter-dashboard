import { CommonModule } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Copy, Download, Eye, LucideAngularModule, Power, SlidersHorizontal, Trash2 } from 'lucide-angular';
import { ToastService } from './toast.service';

export interface GenericRow { resource: string; policy: string; status: string; usage: number; method?: string; limit?: string; scope?: string; algorithm?: string; key?: string; }

@Component({
  selector: 'app-generic-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <section class="generic-page">
      <header class="page-header"><div><p>{{ eyebrow() }}</p><h1>{{ title() }}</h1><span>{{ description() }}</span></div><button *ngIf="actionLabel()" class="primary" (click)="runPrimaryAction()">＋ {{ actionLabel() }}</button></header>
      <div class="generic-layout">
        <div class="main-column">
          <article class="panel">
                        <div class="panel-heading"><div><h2>{{ panelTitle() }}</h2><p>{{ panelSubtitle() }}</p></div><div class="panel-tools"><label *ngIf="searchable()" class="search-box">⌕<input placeholder="Pesquisar..." /></label><button *ngIf="searchable()" (click)="toggleFilter()">⚙ Filtrar</button><button *ngIf="searchable()" (click)="exportRows()">⇩ Exportar</button></div></div><div class="filter-row" *ngIf="filterOpen()">Estado: <button (click)="setStatus('All')">Todos</button><button (click)="setStatus('Active')">Ativas</button><button (click)="setStatus('Paused')">Pausadas</button></div>
            <table><thead><tr><th>{{ firstHeader() }}</th><th>Política</th><th>Estado</th><th>Utilização</th><th *ngIf="showDetails()">Detalhes</th><th *ngIf="showActions()">Ações</th></tr></thead><tbody><tr *ngFor="let row of visibleRows()"><td><span *ngIf="row.method" class="method" [class]="row.method.toLowerCase()">{{ row.method }}</span><strong>{{ row.resource }}</strong><small *ngIf="row.key">{{ row.key }}</small></td><td>{{ row.policy }}</td><td><span class="status" [class.paused]="row.status === 'Paused'">{{ row.status === 'Active' ? 'Ativa' : 'Pausada' }}</span></td><td><div class="usage"><span>{{ row.usage }}%</span><i><em [style.width.%]="row.usage"></em></i></div></td><td *ngIf="showDetails()">{{ row.limit || row.scope || '—' }}</td><td *ngIf="showActions()"><div class="row-actions"><button aria-label="Editar" (click)="rowAction('Editar', row)"><lucide-icon [img]="SlidersHorizontal" size="15" /></button><button aria-label="Copiar" (click)="rowAction('Copiar', row)"><lucide-icon [img]="Copy" size="15" /></button><button aria-label="Ativar" (click)="rowAction('Ativar', row)"><lucide-icon [img]="Power" size="15" /></button><button aria-label="Eliminar" (click)="rowAction('Eliminar', row)"><lucide-icon [img]="Trash2" size="15" /></button></div></td></tr></tbody></table>
          </article>
        </div>
        <aside class="side-note"><span class="sparkle">✧</span><strong>Torne esta vista sua</strong><p>Configure a integração para adaptar esta área ao seu workspace.</p><button (click)="router.navigate(['/definicoes'])">Configure a integração</button></aside>
      </div>
    </section>
  `,
  styles: [`
    .generic-page{display:grid;gap:22px;max-width:1500px}.page-header{display:flex;align-items:end;justify-content:space-between;gap:24px}.page-header p{color:var(--cyan);font-size:10px;font-weight:800;letter-spacing:.14em;margin:0 0 9px}.page-header h1{font:500 34px 'Space Grotesk';margin:0;letter-spacing:-.04em}.page-header span{display:block;color:var(--muted);font-size:14px;margin-top:9px}.primary,.side-note button{border:0;border-radius:7px;background:var(--cyan);color:#06242a;font-weight:700;padding:13px 16px}.generic-layout{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:18px}.panel,.side-note{border:1px solid var(--border);border-radius:10px;background:var(--card)}.panel{padding:20px}.panel-heading{display:flex;justify-content:space-between;align-items:start;gap:15px;margin-bottom:18px}.panel h2{font:500 17px 'Space Grotesk';margin:0}.panel p,.side-note p{color:var(--muted);font-size:12px;margin:7px 0 0}.panel-tools{display:flex;gap:7px;align-items:center}.panel-tools button,.search-box{height:34px;border:1px solid var(--border);background:#11171e;color:#aebbc3;border-radius:6px;padding:0 10px;font-size:11px}.search-box{display:flex;align-items:center;gap:6px}.search-box input{width:145px;border:0;outline:0;background:none;color:var(--text);font-size:11px}.panel table{width:100%;border-collapse:collapse;font-size:12px}.panel th{padding:10px 8px;text-align:left;color:var(--muted);border-bottom:1px solid var(--border);font-size:10px;text-transform:uppercase;letter-spacing:.05em}.panel td{padding:14px 8px;border-bottom:1px solid #202830;color:#bac7ce}.panel td:first-child{display:grid;gap:4px}.panel td small{color:var(--muted);font-size:10px}.status,.method{display:inline-block;width:max-content;border-radius:4px;padding:4px 7px;font-size:9px;font-weight:700}.status{color:#5ed9bf;background:#14342f}.status.paused{color:var(--orange);background:#3a2c1b}.method{margin-right:7px}.method.get{color:#5ed9bf;background:#14342f}.method.post{color:var(--blue);background:#1d2d4b}.method.delete{color:var(--red);background:#3b2028}.usage{display:grid;grid-template-columns:42px 1fr;align-items:center;gap:7px;font-size:10px}.usage i{height:6px;background:#263640;border-radius:5px;overflow:hidden}.usage em{display:block;height:100%;background:var(--cyan);border-radius:5px}.row-actions{display:flex;gap:4px}.row-actions button{width:28px;height:28px;border:1px solid var(--border);background:#11171e;color:var(--muted);border-radius:5px}.side-note{align-self:start;padding:20px}.sparkle{display:grid;place-items:center;width:32px;height:32px;border-radius:8px;background:#12383d;color:var(--cyan);font-size:20px;margin-bottom:16px}.side-note strong{font:500 16px 'Space Grotesk'}.side-note button{margin-top:18px;width:100%;font-size:11px}.side-note p{line-height:1.5}@media(max-width:900px){.generic-layout{grid-template-columns:1fr}.side-note{order:-1}.page-header{align-items:start;flex-direction:column}}@media(max-width:650px){.panel{overflow:auto}.panel-heading{align-items:start;flex-direction:column}.panel table{min-width:650px}}
  `]
})
export class GenericPageComponent {
  readonly router = inject(Router);
  readonly toast = inject(ToastService);
  readonly filterOpen = signal(false); readonly statusFilter = signal('All');
  eyebrow = input('WORKSPACE'); title = input(''); description = input(''); panelTitle = input('Recursos ligados'); panelSubtitle = input(''); actionLabel = input(''); firstHeader = input('Recurso'); rows = input<GenericRow[]>([]); searchable = input(false); showDetails = input(false); showActions = input(false);
  readonly SlidersHorizontal = SlidersHorizontal; readonly Copy = Copy; readonly Power = Power; readonly Trash2 = Trash2; readonly Eye = Eye; readonly Download = Download;
  toggleFilter(): void { this.filterOpen.update((value) => !value); }
  visibleRows(): GenericRow[] { const status = this.statusFilter(); return status === 'All' ? this.rows() : this.rows().filter((row) => row.status === status); }
  setStatus(status: string): void { this.statusFilter.set(status); this.toast.show(status === 'All' ? 'A mostrar todos os estados' : `Filtro: ${status === 'Active' ? 'ativas' : 'pausadas'}`); }
  runPrimaryAction(): void { this.toast.show(`${this.actionLabel()} iniciado`); }
  rowAction(action: string, row: GenericRow): void { this.toast.show(`${action}: ${row.resource}`); }
  exportRows(): void {
    const csv = ['recurso,politica,estado,utilizacao', ...this.visibleRows().map((row) => `${row.resource},${row.policy},${row.status},${row.usage}%`)].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); const link = document.createElement('a'); link.href = url; link.download = `${this.title().toLowerCase().replaceAll(' ', '-')}.csv`; link.click(); URL.revokeObjectURL(url); this.toast.show('Exportação concluída');
  }
}
