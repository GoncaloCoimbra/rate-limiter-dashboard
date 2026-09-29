import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { GenericPageComponent, GenericRow } from '../shared/generic-page.component';
import { TranslationService } from '../shared/translation.service';

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
      [emptyStateTitle]="'noPersonalSettingsTitle'"
      [emptyStateHint]="'noPersonalSettingsHint'"
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
  readonly i18n = inject(TranslationService);

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
