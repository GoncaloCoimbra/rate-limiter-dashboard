import { Component } from '@angular/core';
import { GenericPageComponent, GenericRow } from '../shared/generic-page.component';

@Component({ selector: 'app-client-list', standalone: true, imports: [GenericPageComponent], template: `<app-generic-page eyebrow="CONTROLO DE TRÁFEGO" title="Clientes" description="Compreenda quais consumidores estão a usar a sua API." panelTitle="Recursos ligados" firstHeader="Cliente" [rows]="rows" />` })
export class ClientListComponent {
  rows: GenericRow[] = [
    { resource: 'Acme Inc.', policy: 'Public API', status: 'Active', usage: 68 },
    { resource: 'Northstar Labs', policy: 'Authentication', status: 'Active', usage: 82 },
    { resource: 'Cloudline', policy: 'Premium API', status: 'Active', usage: 42 },
    { resource: 'Internal platform', policy: 'Internal Services', status: 'Active', usage: 56 }
  ];
}
