import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Copy, Download, Eye, LucideAngularModule, Power, SlidersHorizontal, Trash2 } from 'lucide-angular';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ToastService } from './toast.service';

export interface GenericRow { resource: string; policy: string; status: string; usage: number; method?: string; limit?: string; scope?: string; algorithm?: string; key?: string; }

@Component({
  selector: 'app-generic-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <section class="generic-page page-shell">
      <header class="page-header surface-card">
        <div>
          <p>{{ eyebrow() }}</p>
          <h1>{{ title() }}</h1>
          <span>{{ description() }}</span>
        </div>
        <button *ngIf="actionLabel()" class="primary-button" (click)="runPrimaryAction()">＋ {{ actionLabel() }}</button>
      </header>
      <div class="generic-layout">
        <div class="main-column">
          <article class="panel surface-card">
            <div class="panel-heading">
              <div>
                <h2>{{ panelTitle() }}</h2>
                <p>{{ panelSubtitle() }}</p>
              </div>
              <div class="panel-tools">
                <label *ngIf="searchable()" class="search-box">⌕<input [value]="searchTerm()" (input)="onSearch($event)" placeholder="Pesquisar..." /></label>
                <button *ngIf="searchable()" class="ghost-button" (click)="toggleFilter()">⚙ Filtrar</button>
                <button *ngIf="searchable()" class="secondary-button" (click)="exportRows()">⇩ Exportar</button>
              </div>
            </div>

            <div class="filter-row" *ngIf="filterOpen()">
              <span>Estado:</span>
              <button class="ghost-button" (click)="setStatus('All')">Todos</button>
              <button class="ghost-button" (click)="setStatus('Active')">Ativas</button>
              <button class="ghost-button" (click)="setStatus('Paused')">Pausadas</button>
            </div>

            <div class="data-state loading" *ngIf="loading()" role="status" aria-live="polite">
              <span class="state-icon" aria-hidden="true"><span class="state-pulse"></span></span>
              <div>
                <strong>A carregar dados</strong>
                <p>Estamos a sincronizar os dados mais recentes do workspace.</p>
              </div>
            </div>

            <div class="data-state error" *ngIf="error()" role="alert">
              <span class="state-icon" aria-hidden="true">!</span>
              <div>
                <strong>Não foi possível carregar os dados</strong>
                <p>{{ error() }}</p>
              </div>
            </div>

            <div class="data-state empty" *ngIf="!loading() && !error() && visibleRows().length === 0">
              <span class="state-icon" aria-hidden="true">◎</span>
              <div>
                <strong>Sem resultados para mostrar</strong>
                <p>Não existem itens para este filtro ou pesquisa.</p>
              </div>
            </div>

            <table *ngIf="!loading() && !error() && visibleRows().length > 0">
              <thead>
                <tr>
                  <th>{{ firstHeader() }}</th>
                  <th>Política</th>
                  <th>Estado</th>
                  <th>Utilização</th>
                  <th *ngIf="showDetails()">Detalhes</th>
                  <th *ngIf="showActions()">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of visibleRows()">
                  <td>
                    <span *ngIf="row.method" class="method" [class]="row.method.toLowerCase()">{{ row.method }}</span>
                    <strong>{{ row.resource }}</strong>
                    <small *ngIf="row.key">{{ row.key }}</small>
                  </td>
                  <td>{{ row.policy }}</td>
                  <td><span class="status-badge" [class.success]="row.status === 'Active'" [class.warning]="row.status === 'Paused'">{{ row.status === 'Active' ? 'Ativa' : 'Pausada' }}</span></td>
                  <td><div class="usage-cell"><span>{{ row.usage }}%</span><div class="usage-track"><span [style.width.%]="row.usage"></span></div></div></td>
                  <td *ngIf="showDetails()">{{ row.limit || row.scope || '—' }}</td>
                  <td *ngIf="showActions()">
                    <div class="row-actions">
                      <button aria-label="Editar" (click)="rowAction('Editar', row)"><lucide-icon [img]="SlidersHorizontal" size="15" /></button>
                      <button aria-label="Copiar" (click)="rowAction('Copiar', row)"><lucide-icon [img]="Copy" size="15" /></button>
                      <button aria-label="Ativar" (click)="rowAction('Ativar', row)"><lucide-icon [img]="Power" size="15" /></button>
                      <button aria-label="Eliminar" (click)="rowAction('Eliminar', row)"><lucide-icon [img]="Trash2" size="15" /></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </article>
        </div>
        <aside class="side-note surface-card">
          <span class="sparkle">✧</span>
          <strong>Torne esta vista sua</strong>
          <p>Configure a integração para adaptar esta área ao seu workspace.</p>
          <button class="primary-button" (click)="router.navigate(['/definicoes'])">Configure a integração</button>
        </aside>
      </div>
    </section>
  `,
  styles: [`
    .generic-page { display: grid; gap: 22px; max-width: 1500px; }
    .page-header { display: flex; align-items: end; justify-content: space-between; gap: 24px; padding: 1.2rem 1.4rem; }
    .page-header p { color: var(--cyan); font-size: 10px; font-weight: 800; letter-spacing: .14em; margin: 0 0 9px; }
    .page-header h1 { font: 500 34px 'Space Grotesk'; margin: 0; letter-spacing: -.04em; }
    .page-header span { display: block; color: var(--muted); font-size: 14px; margin-top: 9px; }
    .generic-layout { display: grid; grid-template-columns: minmax(0,1fr) 260px; gap: 18px; }
    .panel { padding: 20px; }
    .panel-heading { display: flex; justify-content: space-between; align-items: start; gap: 15px; margin-bottom: 18px; }
    .panel h2 { font: 500 17px 'Space Grotesk'; margin: 0; }
    .panel p, .side-note p { color: var(--muted); font-size: 12px; margin: 7px 0 0; }
    .panel-tools { display: flex; gap: 7px; align-items: center; flex-wrap: wrap; }
    .panel-tools button, .search-box { height: 34px; border-radius: 8px; font-size: 11px; }
    .search-box { display: flex; align-items: center; gap: 6px; padding: 0 10px; border: 1px solid var(--border); background: var(--input-bg); color: var(--muted); }
    .search-box input { width: 145px; border: 0; outline: 0; background: transparent; color: var(--text); font-size: 11px; }
    .panel table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .panel th { padding: 10px 8px; text-align: left; color: var(--muted); border-bottom: 1px solid var(--border); font-size: 10px; text-transform: uppercase; letter-spacing: .05em; }
    .panel td { padding: 14px 8px; border-bottom: 1px solid var(--border); color: var(--text); }
    .panel td:first-child { display: grid; gap: 4px; }
    .panel td small { color: var(--muted); font-size: 10px; }
    .method { display: inline-block; width: max-content; border-radius: 4px; padding: 4px 7px; font-size: 9px; font-weight: 700; margin-right: 7px; }
    .method.get { color: #5ed9bf; background: rgba(38, 194, 129, 0.12); }
    .method.post { color: var(--blue); background: rgba(74,141,255,.15); }
    .method.delete { color: var(--red); background: rgba(239,107,131,.12); }
    .method.put { color: var(--orange); background: rgba(247,165,74,.15); }
    .row-actions { display: flex; gap: 5px; }
    .row-actions button { width: 28px; height: 28px; border: 1px solid var(--border); border-radius: 6px; background: transparent; color: var(--text); display: grid; place-items: center; }
    .usage-cell { display: flex; align-items: center; gap: 8px; }
    .usage-cell span { font-size: 12px; }
    .usage-track { display: block; width: 76px; height: 6px; border-radius: 99px; background: rgba(255,255,255,.05); overflow: hidden; }
    .usage-track span { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, var(--cyan), var(--blue)); }
    .side-note { padding: 20px; display: grid; gap: 12px; align-content: start; }
    .side-note .sparkle { font-size: 28px; color: var(--cyan); }
    .side-note strong { font-size: 18px; }
    .side-note button { width: 100%; }
    .filter-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: 0 0 18px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; background: rgba(255,255,255,.02); }
    .filter-row span { color: var(--muted); font-size: 11px; }
    .filter-row button { font-size: 11px; }
    .main-column { min-width: 0; }
    .data-state { display: flex; align-items: center; gap: 14px; padding: 22px 18px; border: 1px solid var(--border); border-radius: 12px; background: rgba(10, 16, 24, 0.35); }
    .data-state strong { display: block; margin-bottom: 6px; }
    .data-state p { color: var(--muted); margin: 0; }
    .state-icon { display: inline-grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,.03); font-weight: 700; }
    .state-pulse { display: block; width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--cyan); animation: pulse 1.2s ease-in-out infinite; }
    @keyframes pulse { 0% { transform: scale(0.75); opacity: .65; } 70% { transform: scale(1.25); opacity: 1; } 100% { transform: scale(0.75); opacity: .65; } }
    @media (max-width: 980px) { .generic-layout { grid-template-columns: 1fr; } .page-header { display: grid; grid-template-columns: 1fr; align-items: start; } .panel-tools { flex-wrap: wrap; } }
  `]
})
export class GenericPageComponent {
  readonly router = inject(Router);
  readonly toast = inject(ToastService);
  readonly filterOpen = signal(false);
  readonly statusFilter = signal('All');
  readonly searchTerm = signal('');
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly rows = input<GenericRow[]>([]);
  readonly eyebrow = input('WORKSPACE');
  readonly title = input('');
  readonly description = input('');
  readonly panelTitle = input('Recursos ligados');
  readonly panelSubtitle = input('');
  readonly actionLabel = input('');
  readonly firstHeader = input('Recurso');
  readonly searchable = input(false);
  readonly showDetails = input(false);
  readonly showActions = input(false);
  readonly primaryActionRequested = output<void>();
  readonly rowActionRequested = output<{ action: string; row: GenericRow }>();
  readonly searchRequested = output<string>();
  readonly statusChanged = output<string>();
  readonly SlidersHorizontal = SlidersHorizontal;
  readonly Copy = Copy;
  readonly Power = Power;
  readonly Trash2 = Trash2;
  readonly Eye = Eye;
  readonly Download = Download;
  private readonly searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((value) => this.searchRequested.emit(value));
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.searchSubject.next(value);
  }

  toggleFilter(): void { this.filterOpen.update((value) => !value); }

  visibleRows(): GenericRow[] {
    const search = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();
    const rows = this.rows();

    return rows.filter((row) => {
      const matchesStatus = status === 'All' || row.status === status;
      const haystack = [row.resource, row.policy, row.key ?? '', row.method ?? '', row.limit ?? '', row.scope ?? ''].join(' ').toLowerCase();
      const matchesSearch = !search || haystack.includes(search);
      return matchesStatus && matchesSearch;
    });
  }

  setStatus(status: string): void {
    this.statusFilter.set(status);
    this.statusChanged.emit(status);
  }

  runPrimaryAction(): void {
    this.primaryActionRequested.emit();
  }

  rowAction(action: string, row: GenericRow): void {
    this.rowActionRequested.emit({ action, row });
  }

  exportRows(): void {
    const csv = ['recurso,politica,estado,utilizacao', ...this.visibleRows().map((row) => `${row.resource},${row.policy},${row.status},${row.usage}%`)].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.title().toLowerCase().replaceAll(' ', '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    this.toast.show('Exportação concluída');
  }
}
