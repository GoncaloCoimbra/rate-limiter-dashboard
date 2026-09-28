import { Component, inject, OnInit } from '@angular/core';
import { AccessService } from '../access/access.service';
import { GenericPageComponent, GenericRow } from '../shared/generic-page.component';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [GenericPageComponent],
  template: `
    <app-generic-page
      eyebrow="CONTROLO DE TRÁFEGO"
      title="Clientes"
      description="Compreenda quais consumidores estão a usar a sua API."
      panelTitle="Recursos ligados"
      firstHeader="Cliente"
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
export class ClientListComponent implements OnInit {
  private readonly accessService = inject(AccessService);

  rows: GenericRow[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading = true;
    this.error = null;

    this.accessService.listClients().subscribe({
      next: (items) => {
        this.rows = items.map((item) => ({
          resource: item.name || 'Cliente',
          policy: 'Workspace policy',
          status: this.normalizeStatus(item.status),
          usage: 0,
          scope: item.identifier || '—',
          limit: item.createdAt ? `Criado ${item.createdAt}` : '—'
        }));
        this.loading = false;
      },
      error: () => {
        this.rows = [];
        this.loading = false;
        this.error = 'Não foi possível carregar os clientes.';
      }
    });
  }

  handlePrimaryAction(): void {
    // The real creation flow is implemented in the service layer when needed.
  }

  handleRowAction(event: { action: string; row: GenericRow }): void {
    console.debug('[ClientListComponent] row action requested', event.action, event.row.resource);
  }

  private normalizeStatus(status: string | null | undefined): 'Active' | 'Paused' {
    const value = status?.toUpperCase() ?? '';
    return value === 'PAUSED' || value === 'INACTIVE' ? 'Paused' : 'Active';
  }
}
