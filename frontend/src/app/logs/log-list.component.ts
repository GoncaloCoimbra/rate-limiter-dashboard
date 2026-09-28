import { Component } from '@angular/core';
import { GenericPageComponent, GenericRow } from '../shared/generic-page.component';

@Component({ selector: 'app-log-list', standalone: true, imports: [GenericPageComponent], template: `<app-generic-page eyebrow="OBSERVABILIDADE" title="Logs" description="Reveja as últimas decisões de rate-limit." panelTitle="Decisões recentes" firstHeader="Recurso" [rows]="rows" />` })
export class LogListComponent {
  rows: GenericRow[] = [
    { resource: 'POST /api/auth/login', policy: 'Authentication', status: 'Active', usage: 84 },
    { resource: 'GET /api/users', policy: 'Public API', status: 'Active', usage: 68 },
    { resource: 'POST /api/payments', policy: 'Internal Services', status: 'Active', usage: 56 },
    { resource: 'GET /api/products', policy: 'Premium API', status: 'Active', usage: 42 }
  ];
}
