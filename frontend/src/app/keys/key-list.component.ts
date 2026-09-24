import { Component } from '@angular/core';
import { GenericPageComponent, GenericRow } from '../shared/generic-page.component';

@Component({ selector: 'app-key-list', standalone: true, imports: [GenericPageComponent], template: `<app-generic-page eyebrow="CONTROLO DE TRÁFEGO" title="API keys" description="Emita, rode e monitorize chaves de acesso dos consumidores." panelTitle="Recursos ligados" firstHeader="Chave" [rows]="rows" />` })
export class KeyListComponent {
  rows: GenericRow[] = [
    { resource: 'Acme production', key: 'sk_live_••••••••••••4F92', policy: 'Public API', status: 'Active', usage: 68 },
    { resource: 'Mobile app', key: 'sk_live_••••••••••••4F92', policy: 'Authentication', status: 'Active', usage: 82 },
    { resource: 'Partner sandbox', key: 'sk_live_••••••••••••4F92', policy: 'Premium API', status: 'Active', usage: 42 },
    { resource: 'Internal CLI', key: 'sk_live_••••••••••••4F92', policy: 'Internal Services', status: 'Active', usage: 56 }
  ];
}
