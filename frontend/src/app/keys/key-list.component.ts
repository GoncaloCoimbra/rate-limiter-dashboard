import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { KeyRound, LucideAngularModule } from 'lucide-angular';
import { AccessService } from '../access/access.service';
import { PolicyItem, PolicyService } from '../policies/services/policy.service';
import { GenericPageComponent, GenericRow } from '../shared/generic-page.component';
import { ToastService } from '../shared/toast.service';
import { TranslationService } from '../shared/translation.service';

@Component({
  selector: 'app-key-list',
  standalone: true,
  imports: [CommonModule, GenericPageComponent, LucideAngularModule],
  template: `
    <app-generic-page
      eyebrow="CONTROLO DE TRÁFEGO"
      title="API keys"
      description="Emita, rode e monitorize chaves de acesso dos consumidores."
      actionLabel="Criar API key"
      panelTitle="Recursos ligados"
      firstHeader="Chave"
      [rows]="rows"
      [loading]="loading"
      [error]="error"
      [searchable]="true"
      [showActions]="true"
      [rowActions]="['revoke', 'delete']"
      (primaryActionRequested)="openCreateDialog()"
      (rowActionRequested)="handleRowAction($event)"
    />
    <div *ngIf="createDialogOpen" role="presentation" style="position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:20px;background:rgba(0,0,0,.68)">
      <section role="dialog" aria-modal="true" aria-labelledby="key-dialog-title" style="width:min(440px,100%);max-height:90dvh;overflow:auto;padding:24px;border:1px solid var(--border);border-radius:10px;background:var(--card);color:var(--text)">
        <h2 id="key-dialog-title">{{ i18n.translate('createApiKeyTitle') }}</h2>
        <form (submit)="$event.preventDefault(); createKey()" style="display:grid;gap:10px">
          <label for="key-name">{{ i18n.translate('name') }}</label>
          <input id="key-name" name="keyName" [value]="newKeyName" (input)="newKeyName = $any($event.target).value" required maxlength="100" />
          <label for="key-policy">{{ i18n.translate('policyColumn') }}</label>
          <select id="key-policy" name="policy" [value]="newPolicyId" (change)="newPolicyId = $any($event.target).valueAsNumber" required>
            <option value="0" disabled>{{ i18n.translate('selectActivePolicy') }}</option>
            <option *ngFor="let policy of policies" [value]="policy.id">{{ policy.name }} · {{ policy.limit }} / {{ policy.window }}</option>
          </select>
          <div class="key-dialog-actions">
            <button type="button" class="secondary-button" (click)="createDialogOpen = false">{{ i18n.translate('cancel') }}</button>
            <button type="submit" class="primary-button" [disabled]="saving || !policies.length"><lucide-icon [img]="KeyRound" size="16" aria-hidden="true" />{{ saving ? i18n.translate('creating') : i18n.translate('createApiKeyTitle') }}</button>
          </div>
        </form>
      </section>
    </div>
    <div *ngIf="createdKey" role="presentation" style="position:fixed;inset:0;z-index:1001;display:grid;place-items:center;padding:20px;background:rgba(0,0,0,.68)">
      <section role="dialog" aria-modal="true" aria-labelledby="created-key-title" style="width:min(520px,100%);padding:24px;border:1px solid var(--border);border-radius:10px;background:var(--card);color:var(--text)">
        <h2 id="created-key-title">{{ i18n.translate('keyCreatedTitle') }}</h2>
        <p>{{ i18n.translate('keyRevealOnce') }}</p>
        <code style="display:block;overflow-wrap:anywhere;padding:12px;background:var(--input-bg)">{{ createdKey }}</code>
        <p>{{ i18n.translate('policyColumn') }}: {{ createdKeyPolicyName }}</p>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">
          <button type="button" class="secondary-button" (click)="copyCreatedKey()">{{ keyCopied ? i18n.translate('keyCopied') : i18n.translate('copyKey') }}</button>
          <button type="button" class="primary-button" (click)="dismissCreatedKey()">{{ i18n.translate('closeNotification') }}</button>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .key-dialog-actions { display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
    .key-dialog-actions button { min-height: 42px; }
  `]
})
export class KeyListComponent implements OnInit {
  readonly KeyRound = KeyRound;
  private readonly accessService = inject(AccessService);
  private readonly policyService = inject(PolicyService);
  private readonly toast = inject(ToastService);
  readonly i18n = inject(TranslationService);

  rows: GenericRow[] = [];
  policies: PolicyItem[] = [];
  loading = false;
  error: string | null = null;
  saving = false;
  createDialogOpen = false;
  newKeyName = '';
  newPolicyId = 0;
  createdKey: string | null = null;
  createdKeyPolicyName = '';
  keyCopied = false;

  ngOnInit(): void {
    this.loadKeys();
    this.policyService.list(0, 100).subscribe({
      next: (response) => { this.policies = response.content.filter((policy) => policy.status === 'ACTIVE'); },
      error: () => { this.error = this.i18n.translate('policySaveFailed'); }
    });
  }

  loadKeys(): void {
    this.loading = true;
    this.error = null;

    this.accessService.listKeys().subscribe({
      next: (items) => {
        this.rows = items.map((item) => ({
          id: item.id,
          resource: item.name || 'API key',
          key: item.maskedKey || item.name || '••••',
          policy: item.policyName || '—',
          status: this.normalizeStatus(item.status),
          usage: 0,
          scope: item.createdAt ? `Criada ${item.createdAt}` : '—'
        }));
        this.loading = false;
      },
      error: () => {
        this.rows = [];
        this.loading = false;
        this.error = this.i18n.translate('keyActionFailed');
      }
    });
  }

  openCreateDialog(): void {
    this.newKeyName = '';
    this.newPolicyId = this.policies[0]?.id ?? 0;
    this.createDialogOpen = true;
  }

  createKey(): void {
    const policy = this.policies.find((item) => item.id === this.newPolicyId);
    const name = this.newKeyName.trim();
    if (!policy || !name) return;
    this.saving = true;
    this.accessService.createKey(name, policy.id).subscribe({
      next: (item) => {
        this.saving = false;
        this.createDialogOpen = false;
        this.createdKey = item.key ?? null;
        this.createdKeyPolicyName = policy.name;
        this.keyCopied = false;
        this.loadKeys();
      },
      error: () => { this.saving = false; this.error = this.i18n.translate('keyActionFailed'); }
    });
  }

  copyCreatedKey(): void {
    if (!this.createdKey) return;
    void navigator.clipboard.writeText(this.createdKey)
      .then(() => { this.keyCopied = true; })
      .catch(() => { this.error = this.i18n.translate('keyCopyFailed'); });
  }

  dismissCreatedKey(): void {
    this.createdKey = null;
    this.createdKeyPolicyName = '';
    this.keyCopied = false;
  }

  handleRowAction(event: { action: string; row: GenericRow }): void {
    if (event.row.id === undefined) return;
    if (event.action === 'revoke') {
      if (!window.confirm(this.i18n.translate('keyRevokeConfirm'))) return;
      this.accessService.revokeKey(event.row.id).subscribe({
        next: () => { this.toast.show(this.i18n.translate('keyRevoked')); this.loadKeys(); },
        error: () => { this.error = this.i18n.translate('keyActionFailed'); }
      });
    }
    if (event.action === 'delete') {
      if (!window.confirm(this.i18n.translate('keyDeleteConfirm'))) return;
      this.accessService.deleteKey(event.row.id).subscribe({
        next: () => { this.toast.show(this.i18n.translate('keyDeleted')); this.loadKeys(); },
        error: () => { this.error = this.i18n.translate('keyActionFailed'); }
      });
    }
  }

  private normalizeStatus(status: string | null | undefined): 'Active' | 'Paused' {
    const value = status?.toUpperCase() ?? '';
    return value === 'PAUSED' || value === 'INACTIVE' ? 'Paused' : 'Active';
  }
}
