import { Component, inject, OnInit } from '@angular/core';
import { GenericPageComponent, GenericRow } from '../../../shared/generic-page.component';
import { EndpointService } from '../../services/endpoint.service';

@Component({
  selector: 'app-endpoint-list',
  standalone: true,
  imports: [GenericPageComponent],
  template: `
    <app-generic-page
      eyebrow="CONTROLO DE TRÁFEGO"
      title="Endpoints"
      description="Mapeie rotas protegidas para a política correta."
      panelTitle="Recursos ligados"
      firstHeader="Endpoint"
      [rows]="rows"
      [loading]="loading"
      [error]="error"
      [searchable]="true"
      [showActions]="true"
      (primaryActionRequested)="handlePrimaryAction()"
      (rowActionRequested)="handleRowAction($event)"
      (searchRequested)="handleSearch($event)"
      (statusChanged)="handleStatusChange($event)"
    />
  `
})
export class EndpointListComponent implements OnInit {
  private readonly endpointService = inject(EndpointService);

  rows: GenericRow[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadEndpoints();
  }

  loadEndpoints(): void {
    this.loading = true;
    this.error = null;

    this.endpointService.list().subscribe({
      next: (items) => {
        this.rows = items.map((item) => ({
          resource: item.endpoint,
          policy: 'Workspace policy',
          status: item.usageRate > 0 ? 'Active' : 'Paused',
          usage: Math.min(100, Math.round(item.usageRate)),
          limit: `${item.allowedRequests} permitidos`,
          scope: `${item.blockedRequests} bloqueados`
        }));
        this.loading = false;
      },
      error: () => {
        this.rows = [];
        this.loading = false;
        this.error = 'Não foi possível carregar os endpoints do workspace.';
      }
    });
  }

  handlePrimaryAction(): void {
    // Real creation flow should be implemented in the parent or API when available.
  }

  handleRowAction(event: { action: string; row: GenericRow }): void {
    // Parent-level action hooks are intentionally left to the real feature implementation.
    console.debug('[EndpointListComponent] row action requested', event.action, event.row.resource);
  }

  handleSearch(search: string): void {
    // The backend endpoint does not expose a dedicated search endpoint; local filtering is used instead.
    console.debug('[EndpointListComponent] search requested', search);
  }

  handleStatusChange(status: string): void {
    console.debug('[EndpointListComponent] status changed', status);
  }
}
