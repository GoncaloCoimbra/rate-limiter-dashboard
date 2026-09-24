import { Component } from '@angular/core';
import { GenericPageComponent, GenericRow } from '../../../shared/generic-page.component';

@Component({ selector: 'app-endpoint-list', standalone: true, imports: [GenericPageComponent], template: `<app-generic-page eyebrow="CONTROLO DE TRÁFEGO" title="Endpoints" description="Mapeie rotas protegidas para a política correta." panelTitle="Recursos ligados" firstHeader="Método / Endpoint" [rows]="rows" />` })
export class EndpointListComponent {
  rows: GenericRow[] = [
    { resource: '/api/users', method: 'GET', policy: 'Public API', status: 'Active', usage: 68 },
    { resource: '/api/orders', method: 'POST', policy: 'Authentication', status: 'Active', usage: 82 },
    { resource: '/api/products/:id', method: 'GET', policy: 'Premium API', status: 'Active', usage: 42 },
    { resource: '/api/payments', method: 'POST', policy: 'Internal Services', status: 'Active', usage: 56 },
    { resource: '/api/users/:id', method: 'DELETE', policy: 'Public API', status: 'Active', usage: 34 }
  ];
}
