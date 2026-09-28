import { HttpClient } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Download, Eye, LucideAngularModule, Trash2 } from 'lucide-angular';
import { ToastService } from '../shared/toast.service';

interface ExportRecordItem {
  id: number;
  fileName: string;
  rowCount: number;
  createdAt: string;
}

@Component({
  selector: 'app-exports',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, DatePipe],
  template: `
    <section class="exports-page">
      <header class="page-header">
        <div>
          <p>WORKSPACE</p>
          <h1>Histórico de exportações</h1>
          <span>Relatórios guardados e exportações anteriores.</span>
        </div>
      </header>

      <div class="data-state loading" *ngIf="loading" role="status" aria-live="polite">
        <span class="state-icon" aria-hidden="true"><span class="state-pulse"></span></span>
        <div>
          <strong>A carregar exportações</strong>
          <p>Estamos a sincronizar os registos guardados do workspace.</p>
        </div>
      </div>

      <div class="data-state error" *ngIf="error" role="alert">
        <span class="state-icon" aria-hidden="true">!</span>
        <div>
          <strong>Não foi possível carregar os registos</strong>
          <p>{{ error }}</p>
        </div>
      </div>

      <div class="exports-layout" *ngIf="!loading && !error">
        <article class="panel">
          <div class="panel-heading">
            <div>
              <h2>Relatórios guardados</h2>
              <p>Ficheiros gerados neste workspace</p>
            </div>
          </div>

          <table *ngIf="exports.length; else emptyState">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Nome</th>
                <th>Data</th>
                <th>Linhas</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of exports">
                <td><span class="file-type">CSV</span></td>
                <td><strong>{{ item.fileName }}</strong></td>
                <td>{{ item.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ item.rowCount }}</td>
                <td>
                  <div class="actions">
                    <button type="button" [disabled]="true" [title]="'Pré-visualização indisponível: a operação não existe no backend.'">
                      <lucide-icon [img]="Eye" size="15" />
                    </button>
                    <button type="button" (click)="downloadCsv(item)">
                      <lucide-icon [img]="Download" size="15" />
                    </button>
                    <button type="button" [disabled]="true" [title]="'Remoção indisponível: a API de remoção ainda não foi implementada.'">
                      <lucide-icon [img]="Trash2" size="15" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <ng-template #emptyState>
            <div class="empty-state">
              <strong>Sem exportações guardadas</strong>
              <p>Ainda não existem registos de exportação para este workspace.</p>
            </div>
          </ng-template>
        </article>

        <aside class="side-note">
          <span>✧</span>
          <strong>Torne esta vista sua</strong>
          <p>Configure a integração para adaptar esta área ao seu workspace.</p>
          <button type="button" [disabled]="true" [title]="'Configuração indisponível: ainda não existe um endpoint para esta ação.'">Configure a integração</button>
        </aside>
      </div>
    </section>
  `,
  styles: [
    `.exports-page{display:grid;gap:22px;max-width:1500px}`,
    `.page-header p{color:var(--cyan);font-size:10px;font-weight:800;letter-spacing:.14em}`,
    `.page-header h1{font:500 34px 'Space Grotesk';margin:0}`,
    `.page-header span{display:block;color:var(--muted);margin-top:9px;font-size:14px}`,
    `.exports-layout{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:18px}`,
    `.panel,.side-note{border:1px solid var(--border);border-radius:10px;background:var(--card)}`,
    `.panel{padding:20px}`,
    `.panel h2{font:500 17px 'Space Grotesk';margin:0}`,
    `.panel p,.side-note p{color:var(--muted);font-size:12px;margin:7px 0 18px}`,
    `table{width:100%;border-collapse:collapse;font-size:12px}`,
    `th{text-align:left;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.05em;padding:0 10px 10px}`,
    `td{padding:12px 10px;border-top:1px solid var(--border);color:var(--text)}`,
    `.file-type{display:inline-flex;align-items:center;padding:6px 8px;border-radius:6px;background:rgba(94,217,191,.12);color:#5ed9bf;font-weight:700;font-size:9px}`,
    `.actions{display:flex;gap:8px}`,
    `.actions button,.side-note button{width:30px;height:30px;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--text);display:grid;place-items:center}`,
    `.side-note{padding:20px;display:grid;align-content:start;gap:12px}`,
    `.side-note > span{display:grid;place-items:center;width:32px;height:32px;border-radius:8px;background:#12383d;color:var(--cyan);font-size:20px}`,
    `.side-note strong{font:500 16px 'Space Grotesk'}`,
    `.side-note button{margin-top:6px;width:100%;height:auto;padding:13px 16px;border:0;border-radius:7px;background:var(--cyan);color:#06242a;font-weight:700;font-size:11px}`,
    `.side-note button:disabled{opacity:.5;cursor:not-allowed}`,
    `.data-state{display:flex;align-items:center;gap:14px;padding:22px 18px;border:1px solid var(--border);border-radius:12px;background:rgba(10,16,24,.35)}`,
    `.data-state strong{display:block;margin-bottom:6px}`,
    `.data-state p{color:var(--muted);margin:0}`,
    `.state-icon{display:inline-grid;place-items:center;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.03);font-weight:700}`,
    `.state-pulse{display:block;width:12px;height:12px;border-radius:50%;border:2px solid var(--cyan);animation:pulse 1.2s ease-in-out infinite}`,
    `@keyframes pulse{0%{transform:scale(.75);opacity:.65}70%{transform:scale(1.25);opacity:1}100%{transform:scale(.75);opacity:.65}}`,
    `.empty-state{padding:28px 16px;border:1px dashed var(--border);border-radius:10px;color:var(--muted);text-align:center}`,
    `.empty-state strong{display:block;color:var(--text);margin-bottom:8px}`,
    '@media(max-width:900px){.exports-layout{grid-template-columns:1fr}.side-note{order:-1}}'
  ]
})
export class ExportsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  readonly toast = inject(ToastService);
  readonly Eye = Eye;
  readonly Download = Download;
  readonly Trash2 = Trash2;

  exports: ExportRecordItem[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadExports();
  }

  loadExports(): void {
    this.loading = true;
    this.error = null;

    this.http.get<ExportRecordItem[]>('/api/exports').subscribe({
      next: (records) => {
        this.exports = records;
        this.loading = false;
      },
      error: () => {
        this.exports = [];
        this.loading = false;
        this.error = 'Não foi possível carregar o histórico de exportações.';
      }
    });
  }

  downloadCsv(item: ExportRecordItem): void {
    const csv = ['fileName,rowCount,createdAt', `${item.fileName},${item.rowCount},${item.createdAt}`].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = item.fileName || 'export.csv';
    link.click();
    URL.revokeObjectURL(url);
    this.toast.show('Ficheiro exportado com sucesso.');
  }
}
