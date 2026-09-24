import { Component } from '@angular/core';
import { GenericPageComponent, GenericRow } from '../shared/generic-page.component';

@Component({ selector: 'app-rate-limits', standalone: true, imports: [GenericPageComponent], template: `<app-generic-page eyebrow="CONTROLO DE TRÁFEGO" title="Rate limits" description="Monitorize a saúde de cada rate limiter ativo." panelTitle="Limitadores ativos" firstHeader="Recurso" [rows]="rows" />` })
export class RateLimitsComponent {
  rows: GenericRow[] = [
    { resource: 'POST /api/auth/login', policy: 'Authentication', status: 'Active', usage: 84 },
    { resource: 'GET /api/users', policy: 'Public API', status: 'Active', usage: 68 },
    { resource: 'POST /api/payments', policy: 'Internal Services', status: 'Active', usage: 56 },
    { resource: 'GET /api/products', policy: 'Premium API', status: 'Active', usage: 42 }
  ];
}
