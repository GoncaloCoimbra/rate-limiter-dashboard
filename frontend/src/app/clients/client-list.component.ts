import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { LucideAngularModule, UserPlus } from 'lucide-angular';
import { AccessService } from '../access/access.service';
import { GenericPageComponent, GenericRow } from '../shared/generic-page.component';
import { ToastService } from '../shared/toast.service';
import { TranslationService } from '../shared/translation.service';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, GenericPageComponent, LucideAngularModule],
  template: `
    <app-generic-page
      eyebrow="CONTROLO DE TRÁFEGO"
      title="Clientes"
      description="Compreenda quais consumidores estão a usar a sua API."
      actionLabel="Criar cliente"
      panelTitle="Recursos ligados"
      firstHeader="Cliente"
      [rows]="rows"
      [loading]="loading"
      [error]="error"
      [searchable]="true"
      [showActions]="true"
      [rowActions]="['delete']"
      (primaryActionRequested)="handlePrimaryAction()"
      (rowActionRequested)="handleRowAction($event)"
    />
    <div *ngIf="createDialogOpen" class="modal-backdrop" (click)="closeDialogOnBackdrop($event)">
      <section class="client-dialog" role="dialog" aria-modal="true" aria-labelledby="client-dialog-title">
        <h2 id="client-dialog-title">{{ i18n.translate('createClient') }}</h2>
        <form (submit)="$event.preventDefault(); createClient()">
          <label for="client-name">{{ i18n.translate('clientName') }}</label>
          <input id="client-name" name="clientName" [value]="draftName" (input)="draftName = $any($event.target).value" required maxlength="100" />
          <label for="client-identifier">{{ i18n.translate('clientIdentifier') }}</label>
          <input id="client-identifier" name="clientIdentifier" [value]="draftIdentifier" (input)="draftIdentifier = $any($event.target).value" required maxlength="160" />
          <div class="dialog-actions">
            <button type="button" class="secondary-button" (click)="createDialogOpen = false">{{ i18n.translate('cancel') }}</button>
            <button type="submit" class="primary-button" [disabled]="saving || !draftName.trim() || !draftIdentifier.trim()"><lucide-icon [img]="UserPlus" size="16" aria-hidden="true" />{{ saving ? i18n.translate('creating') : i18n.translate('createClient') }}</button>
          </div>
        </form>
      </section>
    </div>
  `
})
export class ClientListComponent implements OnInit {
  readonly UserPlus = UserPlus;
  private readonly accessService = inject(AccessService);
  private readonly toast = inject(ToastService);
  readonly i18n = inject(TranslationService);

  rows: GenericRow[] = [];
  loading = false;
  error: string | null = null;
  createDialogOpen = false;
  saving = false;
  draftName = '';
  draftIdentifier = '';

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading = true;
    this.error = null;

    this.accessService.listClients().subscribe({
      next: (items) => {
        this.rows = items.map((item) => ({
          id: item.id,
          resource: item.name || 'Cliente',
          policy: 'Workspace policy',
          status: this.normalizeStatus(item.status),
          usage: 0,
          scope: item.identifier || '—',
          limit: item.createdAt ? `Criado ${item.createdAt}` : '—'
        }));
        this.loading = false;
      },
      error: () => {
        this.rows = [];
        this.loading = false;
        this.error = 'Não foi possível carregar os clientes.';
      }
    });
  }

  handlePrimaryAction(): void {
    this.draftName = '';
    this.draftIdentifier = '';
    this.createDialogOpen = true;
  }

  handleRowAction(event: { action: string; row: GenericRow }): void {
    if (event.action !== 'delete' || event.row.id === undefined) return;
    if (!window.confirm(this.i18n.translate('clientDeleteConfirm'))) return;
    this.accessService.deleteClient(event.row.id).subscribe({
      next: () => { this.toast.show(this.i18n.translate('clientDeleted')); this.loadClients(); },
      error: () => { this.error = this.i18n.translate('errorLoadingData'); }
    });
  }

  createClient(): void {
    const name = this.draftName.trim();
    const identifier = this.draftIdentifier.trim();
    if (!name || !identifier || this.saving) return;
    this.saving = true;
    this.accessService.createClient(name, identifier).subscribe({
      next: () => {
        this.saving = false;
        this.createDialogOpen = false;
        this.toast.show(this.i18n.translate('clientCreated'));
        this.loadClients();
      },
      error: () => {
        this.saving = false;
        this.error = this.i18n.translate('clientCreateFailed');
      }
    });
  }

  closeDialogOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.saving) this.createDialogOpen = false;
  }

  private normalizeStatus(status: string | null | undefined): 'Active' | 'Paused' {
    const value = status?.toUpperCase() ?? '';
    return value === 'PAUSED' || value === 'INACTIVE' ? 'Paused' : 'Active';
  }
}
