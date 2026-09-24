import { Component } from '@angular/core';
import { GenericPageComponent, GenericRow } from '../shared/generic-page.component';

@Component({ selector: 'app-settings', standalone: true, imports: [GenericPageComponent], template: `<app-generic-page eyebrow="WORKSPACE" title="Definições" description="Gira as preferências e integrações do workspace." panelTitle="Recursos ligados" firstHeader="Recurso" [rows]="rows" />` })
export class SettingsComponent {
  rows: GenericRow[] = [
    { resource: 'API gateway', policy: 'Public API', status: 'Active', usage: 68 },
    { resource: 'Authentication service', policy: 'Authentication', status: 'Active', usage: 82 },
    { resource: 'Payments integration', policy: 'Internal Services', status: 'Active', usage: 56 },
    { resource: 'Premium workspace', policy: 'Premium API', status: 'Active', usage: 42 }
  ];
}
