import { Component, inject, OnInit } from '@angular/core';
import { AccessService } from '../access/access.service';
import { GenericPageComponent, GenericRow } from '../shared/generic-page.component';

@Component({
  selector: 'app-key-list',
  standalone: true,
  imports: [GenericPageComponent],
  template: `
    <app-generic-page
      eyebrow="CONTROLO DE TRÁFEGO"
      title="API keys"
      description="Emita, rode e monitorize chaves de acesso dos consumidores."
      panelTitle="Recursos ligados"
      firstHeader="Chave"
      [rows]="rows"
      [loading]="loading"
      [error]="error"
      [searchable]="true"
      [showActions]="true"
      (primaryActionRequested)="handlePrimaryAction()"
      (rowActionRequested)="handleRowAction($event)"
    />
  `
})
export class KeyListComponent implements OnInit {
  private readonly accessService = inject(AccessService);

  rows: GenericRow[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadKeys();
  }

  loadKeys(): void {
    this.loading = true;
    this.error = null;

    this.accessService.listKeys().subscribe({
      next: (items) => {
        this.rows = items.map((item) => ({
          resource: item.name || 'API key',
          key: item.maskedKey || item.name || '••••',
          policy: 'Workspace policy',
          status: this.normalizeStatus(item.status),
          usage: 0,
          scope: item.createdAt ? `Criada ${item.createdAt}` : '—'
        }));
        this.loading = false;
      },
      error: () => {
        this.rows = [];
        this.loading = false;
        this.error = 'Não foi possível carregar as API keys.';
      }
    });
  }

  handlePrimaryAction(): void {
    // The real creation flow is implemented in the service layer when needed.
  }

  handleRowAction(event: { action: string; row: GenericRow }): void {
    console.debug('[KeyListComponent] row action requested', event.action, event.row.resource);
  }

  private normalizeStatus(status: string | null | undefined): 'Active' | 'Paused' {
    const value = status?.toUpperCase() ?? '';
    return value === 'PAUSED' || value === 'INACTIVE' ? 'Paused' : 'Active';
  }
}
