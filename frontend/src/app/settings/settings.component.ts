import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { GenericPageComponent, GenericRow } from '../shared/generic-page.component';

interface DashboardSettingItem {
  key: string;
  value: string;
  ownerUsername?: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [GenericPageComponent],
  template: `
    <app-generic-page
      eyebrow="WORKSPACE"
      title="Definições"
      description="Gira as preferências e integrações do workspace."
      panelTitle="Configurações pessoais"
      firstHeader="Recurso"
      [rows]="rows"
      [loading]="loading"
      [error]="error"
      [searchable]="true"
      [showDetails]="true"
      [showActions]="false"
    />
  `
})
export class SettingsComponent implements OnInit {
  private readonly http = inject(HttpClient);

  rows: GenericRow[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading = true;
    this.error = null;

    this.http.get<DashboardSettingItem[]>('/api/settings').subscribe({
      next: (items) => {
        this.rows = items.map((item) => ({
          resource: item.key,
          policy: 'Pessoal',
          status: 'Active',
          usage: 100,
          scope: item.value || '—'
        }));
        this.loading = false;
      },
      error: () => {
        this.rows = [];
        this.loading = false;
        this.error = 'Não foi possível carregar as definições do workspace.';
      }
    });
  }
}
