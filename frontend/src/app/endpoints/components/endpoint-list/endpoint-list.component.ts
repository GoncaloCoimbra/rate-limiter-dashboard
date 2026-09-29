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
      [showActions]="false"
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

  handleSearch(value: string): void {
    // Search is handled by the shared GenericPageComponent.
    void value;
  }

  handleStatusChange(status: string): void {
    // Status filtering is handled by the shared GenericPageComponent.
    void status;
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

}
