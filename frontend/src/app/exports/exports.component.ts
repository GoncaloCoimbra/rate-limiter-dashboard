import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { Download, Eye, LucideAngularModule, Trash2 } from 'lucide-angular';
import { ToastService } from '../shared/toast.service';

interface ExportRow { type: string; name: string; date: string; rows: number; }

@Component({ selector: 'app-exports', standalone: true, imports: [CommonModule, LucideAngularModule], template: `
<section class="exports-page"><header class="page-header"><div><p>WORKSPACE</p><h1>Histórico de exportações</h1><span>Relatórios guardados e exportações anteriores.</span></div></header><div class="exports-layout"><article class="panel"><div class="panel-heading"><div><h2>Relatórios guardados</h2><p>Ficheiros gerados neste workspace</p></div></div><table><thead><tr><th>Tipo</th><th>Nome</th><th>Data</th><th>Linhas</th><th>Ações</th></tr></thead><tbody><tr *ngFor="let item of exports"><td><span class="file-type">{{item.type}}</span></td><td><strong>{{item.name}}</strong></td><td>{{item.date}}</td><td>{{item.rows}}</td><td><div class="actions"><button (click)="toast.show('Funcionalidade disponível em breve')"><lucide-icon [img]="Eye" size="15" /></button><button (click)="downloadCsv()"><lucide-icon [img]="Download" size="15" /></button><button (click)="toast.show('Funcionalidade disponível em breve')"><lucide-icon [img]="Trash2" size="15" /></button></div></td></tr></tbody></table></article><aside class="side-note"><span>✧</span><strong>Torne esta vista sua</strong><p>Configure a integração para adaptar esta área ao seu workspace.</p><button (click)="toast.show('Funcionalidade disponível em breve')">Configure a integração</button></aside></div></section>`, styles: [`.exports-page{display:grid;gap:22px;max-width:1500px}.page-header p{color:var(--cyan);font-size:10px;font-weight:800;letter-spacing:.14em}.page-header h1{font:500 34px 'Space Grotesk';margin:0}.page-header span{display:block;color:var(--muted);margin-top:9px;font-size:14px}.exports-layout{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:18px}.panel,.side-note{border:1px solid var(--border);border-radius:10px;background:var(--card)}.panel{padding:20px}.panel h2{font:500 17px 'Space Grotesk';margin:0}.panel p,.side-note p{color:var(--muted);font-size:12px;margin:7px 0 18px}table{width:100%;border-collapse:collapse;font-size:12px}th{text-align:left;color:var(--muted);font-size:10px;text-transform:uppercase;padding:10px 8px;border-bottom:1px solid var(--border)}td{padding:15px 8px;color:#bac7ce;border-bottom:1px solid #202830}.file-type{color:var(--cyan);background:#143337;border-radius:4px;padding:4px 6px;font-size:9px;font-weight:700}.actions{display:flex;gap:4px}.actions button{width:28px;height:28px;border:1px solid var(--border);background:#11171e;color:var(--muted);border-radius:5px}.side-note{align-self:start;padding:20px}.side-note>span{display:grid;place-items:center;width:32px;height:32px;border-radius:8px;background:#12383d;color:var(--cyan);font-size:20px;margin-bottom:16px}.side-note strong{font:500 16px 'Space Grotesk'}.side-note button{margin-top:18px;width:100%;border:0;border-radius:7px;background:var(--cyan);color:#06242a;font-weight:700;padding:13px 16px;font-size:11px}@media(max-width:900px){.exports-layout{grid-template-columns:1fr}.side-note{order:-1}}`] })
export class ExportsComponent {
  readonly toast = inject(ToastService); readonly Eye=Eye; readonly Download=Download; readonly Trash2=Trash2;
  exports: ExportRow[] = [{type:'CSV',name:'rate-limit-events.csv',date:'hoje 10:32',rows:8},{type:'CSV',name:'rate-policies.csv',date:'ontem 16:45',rows:4},{type:'PDF',name:'rate-limit-comparison.pdf',date:'ontem 14:20',rows:12}];
  downloadCsv(): void { const csv='tipo,nome,data,linhas\n'+this.exports.map((item)=>`${item.type},${item.name},${item.date},${item.rows}`).join('\n'); const link=document.createElement('a'); link.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); link.download='rate-limit-exports.csv'; link.click(); URL.revokeObjectURL(link.href); this.toast.show('Exportação concluída'); }
  preview(item: ExportRow): void { this.toast.show(`${item.name}: ${item.rows} linhas`); }
  remove(item: ExportRow): void { this.exports = this.exports.filter((entry) => entry !== item); this.toast.show('Exportação removida'); }
  configure(): void { this.toast.show('Integração pronta para configuração'); }
  @HostListener('click', ['$event'])
  handleExportAction(event: MouseEvent): void {
    const button = (event.target as HTMLElement).closest('button');
    const actions = button?.parentElement;
    if (!button || !actions?.classList.contains('actions')) return;
    const index = Array.from(actions.children).indexOf(button);
    const rowElement = button.closest('tr');
    const rowIndex = rowElement?.parentElement ? Array.from(rowElement.parentElement.children).indexOf(rowElement) : -1;
    const row = this.exports[rowIndex];
    if (!row) return;
    if (index % 3 === 0) this.preview(row);
    if (index % 3 === 1) this.downloadCsv();
    if (index % 3 === 2) this.remove(row);
  }
}
