import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ChevronLeft, ChevronRight, Copy, Download, LucideAngularModule, Power, Search, SlidersHorizontal, Trash2 } from 'lucide-angular';
import { PolicyItem, PolicyService } from '../../services/policy.service';
import { ToastService } from '../../../shared/toast.service';
import { TranslationService } from '../../../shared/translation.service';

interface PolicyRow { id: number; name: string; algo: string; limit: string; window: string; scope: string; status: string; }

@Component({
  selector: 'app-policy-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <section class="policies-page">
      <header class="page-header"><div><p>{{ i18n.translate('traffic') }} / {{ i18n.translate('policies') }}</p><h1>{{ i18n.translate('policyHeading') }}</h1><span>{{ i18n.translate('policyDescription') }}</span></div><button class="primary-button" type="button" (click)="createPolicy()" [disabled]="saving">{{ i18n.translate('createPolicy') }}</button></header>
      <div class="summary-strip"><div><small>{{ i18n.translate('totalPolicies') }}</small><strong>{{ totalElements }}</strong></div><div><small>{{ i18n.translate('activeOnPage') }}</small><strong>{{ countStatus('Active') }}</strong></div><div><small>{{ i18n.translate('pausedOnPage') }}</small><strong>{{ countStatus('Paused') }}</strong></div></div>
      <article class="panel"><div class="panel-heading"><div><h2>{{ i18n.translate('policiesConfigured') }}</h2><p>{{ i18n.translate('configuredPoliciesHint') }}</p></div><div class="tools"><label><lucide-icon [img]="Search" size="14" aria-hidden="true" /><input [attr.aria-label]="i18n.translate('searchPlaceholder')" [value]="searchTerm" (input)="searchTerm = $any($event.target).value" [placeholder]="i18n.translate('searchPlaceholder')" /></label><button type="button" (click)="filterOpen = !filterOpen" [attr.aria-expanded]="filterOpen"><lucide-icon [img]="SlidersHorizontal" size="14" aria-hidden="true" /> {{ i18n.translate('filter') }}</button><button type="button" (click)="exportPolicies()"><lucide-icon [img]="Download" size="14" aria-hidden="true" /> {{ i18n.translate('export') }}</button></div></div>
        <div class="filter-row" *ngIf="filterOpen"><span>{{ i18n.translate('status') }}:</span><button type="button" (click)="statusFilter = 'All'">{{ i18n.translate('all') }}</button><button type="button" (click)="statusFilter = 'Active'">{{ i18n.translate('activeFilter') }}</button><button type="button" (click)="statusFilter = 'Paused'">{{ i18n.translate('pausedFilter') }}</button></div>
        <p *ngIf="loading">{{ i18n.translate('loadingData') }}...</p>
        <table *ngIf="!loading && visiblePolicies().length"><thead><tr><th>{{ i18n.translate('policyColumn') }}</th><th>{{ i18n.translate('algorithm') }}</th><th>{{ i18n.translate('requestLimit') }}</th><th>{{ i18n.translate('details') }}</th><th>{{ i18n.translate('status') }}</th><th>{{ i18n.translate('actions') }}</th></tr></thead><tbody><tr *ngFor="let policy of visiblePolicies()"><td><strong>{{ policy.name }}</strong><small>{{ i18n.translate('traffic') }}</small></td><td>{{ algorithmLabel(policy.algo) }}</td><td>{{ policy.limit }} / {{ windowLabel(policy.window) }}</td><td>{{ policy.scope }}</td><td><span class="status" [class.paused]="policy.status === 'Paused'">{{ i18n.translate(policy.status === 'Active' ? 'active' : 'paused') }}</span></td><td><div class="actions"><button [attr.aria-label]="i18n.translate('edit')" (click)="editPolicy(policy)"><lucide-icon [img]="SlidersHorizontal" size="15" /></button><button [attr.aria-label]="i18n.translate('copy')" (click)="copyPolicy(policy)"><lucide-icon [img]="Copy" size="15" /></button><button [attr.aria-label]="i18n.translate(policy.status === 'Active' ? 'paused' : 'activate')" (click)="togglePolicy(policy)"><lucide-icon [img]="Power" size="15" /></button><button [attr.aria-label]="i18n.translate('delete')" (click)="deletePolicy(policy)"><lucide-icon [img]="Trash2" size="15" /></button></div></td></tr></tbody></table>
        <p class="no-matches" *ngIf="!loading && !visiblePolicies().length">{{ i18n.translate('noMatchingPolicies') }}</p>
        <nav class="pager" *ngIf="totalPages > 0" [attr.aria-label]="i18n.translate('policies')"><button type="button" (click)="previousPage()" [disabled]="page === 0" [attr.aria-label]="i18n.translate('previousPage')"><lucide-icon [img]="ChevronLeft" size="16" aria-hidden="true" /></button><span>{{ page + 1 }} / {{ totalPages }} &middot; {{ totalElements }} {{ i18n.translate(totalElements === 1 ? 'policyColumn' : 'policies').toLowerCase() }}</span><button type="button" (click)="nextPage()" [disabled]="page + 1 >= totalPages" [attr.aria-label]="i18n.translate('nextPage')"><lucide-icon [img]="ChevronRight" size="16" aria-hidden="true" /></button></nav>
      </article>
      <div *ngIf="createDialogOpen" class="backdrop" role="presentation">
        <section role="dialog" class="dialog-panel" aria-modal="true" aria-labelledby="policy-dialog-title">
          <h2 id="policy-dialog-title">{{ i18n.translate(editingPolicyId === null ? 'createPolicyDialog' : 'editPolicyDialog') }}</h2>
          <form (submit)="$event.preventDefault(); savePolicy()" style="display:grid;gap:10px">
            <label for="policy-name">{{ i18n.translate('policyName') }}</label>
            <input id="policy-name" name="policyName" [value]="newPolicyName" (input)="newPolicyName = $any($event.target).value" required maxlength="100" />
            <label for="policy-algorithm">{{ i18n.translate('algorithm') }}</label>
            <select id="policy-algorithm" name="algorithm" [value]="newPolicyAlgorithm" (change)="newPolicyAlgorithm = $any($event.target).value">
              <option value="FIXED_WINDOW">{{ i18n.translate('fixedWindow') }}</option>
              <option value="TOKEN_BUCKET">{{ i18n.translate('tokenBucket') }}</option>
              <option value="SLIDING_WINDOW">{{ i18n.translate('slidingWindow') }}</option>
            </select>
            <label for="policy-limit">{{ i18n.translate('requestLimit') }}</label>
            <input id="policy-limit" name="policyLimit" type="number" min="1" [value]="newPolicyLimit" (input)="newPolicyLimit = $any($event.target).valueAsNumber" required />
            <label for="policy-window">{{ i18n.translate('window') }}</label>
            <select id="policy-window" name="window" [value]="newPolicyWindow" (change)="newPolicyWindow = $any($event.target).value">
              <option value="MINUTE">{{ i18n.translate('perMinute') }}</option>
              <option value="SECOND">{{ i18n.translate('perSecond') }}</option>
              <option value="HOUR">{{ i18n.translate('perHour') }}</option>
            </select>
            <div class="dialog-actions">
              <button type="button" class="secondary-button" (click)="closePolicyDialog()">{{ i18n.translate('cancel') }}</button>
              <button type="submit" class="primary-button" [disabled]="saving">{{ saving ? i18n.translate('creating') : i18n.translate(editingPolicyId === null ? 'createPolicy' : 'save') }}</button>
            </div>
          </form>
        </section>
      </div>
      <div *ngIf="pendingDeletePolicy as policy" class="backdrop" role="presentation" (click)="cancelDelete()">
        <section role="alertdialog" class="dialog-panel confirm-dialog" aria-modal="true" aria-labelledby="delete-policy-title" aria-describedby="delete-policy-message" (click)="$event.stopPropagation()">
          <span class="delete-mark" aria-hidden="true"><lucide-icon [img]="Trash2" size="21" /></span>
          <h2 id="delete-policy-title">{{ i18n.translate('confirmPolicyDeleteTitle') }}</h2>
          <p id="delete-policy-message">{{ i18n.translate('policyDeleteConfirm') }}</p>
          <strong class="delete-target">{{ policy.name }}</strong>
          <div class="dialog-actions">
            <button type="button" class="secondary-button" (click)="cancelDelete()">{{ i18n.translate('cancel') }}</button>
            <button type="button" class="danger-button" (click)="confirmDeletePolicy()" [disabled]="deleting"><lucide-icon [img]="Trash2" size="15" />{{ i18n.translate('delete') }}</button>
          </div>
        </section>
      </div>
    </section>
  `,
  styles: [
    `
    :host { display: block; }
    .policies-page { display: grid; gap: 22px; max-width: 1500px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 22px 24px; border: 1px solid rgba(117, 145, 168, 0.22); border-radius: 18px; background: linear-gradient(135deg, rgba(17, 23, 30, 0.96), rgba(22, 27, 34, 0.9)); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 18px 24px rgba(0, 0, 0, 0.18); }
    .page-header > div { flex: 1 1 auto; min-width: 0; }
    .page-header p { color: var(--cyan); font-size: 10px; font-weight: 800; letter-spacing: 0.14em; margin: 0 0 9px; }
    .page-header h1 { font: 500 34px 'Space Grotesk'; margin: 0; }
    .page-header span { display: block; color: var(--muted); font-size: 14px; margin-top: 9px; }
    .primary-button, .secondary-button { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; border-radius: 12px; padding: 0.8rem 1.1rem; font-size: 0.9rem; font-weight: 700; transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease; }
    .primary-button { border: 1px solid transparent; background: linear-gradient(135deg, var(--cyan), #58d7dd 60%, #88f0ee 100%); color: #06242a; box-shadow: 0 12px 18px rgba(53, 200, 207, 0.2); white-space: nowrap; margin-left: auto; }
    .secondary-button { border: 1px solid var(--border); background: transparent; color: var(--text); }
    .primary-button:hover, .secondary-button:hover { transform: translateY(-1px); }
    .primary-button:disabled, .secondary-button:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .summary-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
    .summary-strip div { display: grid; gap: 7px; padding: 16px 18px; background: var(--card); }
    .summary-strip small { color: var(--muted); font-size: 11px; }
    .summary-strip strong { font: 500 22px 'Space Grotesk'; }
    .panel { border: 1px solid var(--border); border-radius: 10px; background: var(--card); padding: 20px; }
    .panel-heading { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 18px; }
    .panel h2 { font: 500 17px 'Space Grotesk'; margin: 0; }
    .panel p { color: var(--muted); font-size: 12px; margin: 7px 0; }
    .tools { display: flex; gap: 7px; }
    .tools button, .tools label { height: 34px; border: 1px solid var(--border); background: var(--input-bg); color: var(--text); border-radius: 6px; padding: 0 10px; font-size: 11px; }
    .tools label { display: flex; align-items: center; gap: 6px; }
    .tools input { width: 140px; border: 1px solid var(--border); background: transparent; color: var(--text); border-radius: 6px; padding: 0 10px; height: 32px; }
    .filter-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding-bottom: 14px; }
    .filter-row > span { display: inline-flex; align-items: center; min-height: 34px; color: var(--muted); font-size: 12px; }
    .filter-row button { display: inline-flex; align-items: center; justify-content: center; min-height: 34px; border: 1px solid var(--border); background: var(--input-bg); color: var(--text); border-radius: 999px; padding: 0 12px; line-height: 1.2; }
    .actions { display: flex; gap: 8px; }
    .actions button { width: 32px; height: 32px; border: 1px solid var(--border); background: var(--input-bg); color: var(--text); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; }
    .status { display: inline-flex; align-items: center; padding: 6px 10px; border-radius: 999px; background: rgba(75, 204, 154, 0.12); color: #7ae3bd; border: 1px solid rgba(75, 204, 154, 0.3); }
    .status.paused { background: rgba(255, 188, 91, 0.12); color: #ffc76d; border-color: rgba(255, 188, 91, 0.35); }
    .dialog-panel { width: min(540px, 92vw); padding: 24px; border-radius: 18px; border: 1px solid var(--border); background: var(--card); box-shadow: 0 20px 36px rgba(0, 0, 0, 0.28); }
    .dialog-panel h2 { margin: 0 0 12px; font: 500 22px 'Space Grotesk'; }
    .confirm-dialog { width: min(420px, 92vw); text-align: center; }
    .delete-mark { display: grid; place-items: center; width: 48px; height: 48px; margin: 0 auto 16px; border: 1px solid rgba(255, 107, 107, 0.3); border-radius: 14px; background: rgba(255, 107, 107, 0.1); color: #ff8585; }
    .confirm-dialog h2 { margin-bottom: 8px; }
    .confirm-dialog > p { color: var(--muted); font-size: 13px; margin: 0; }
    .delete-target { display: block; overflow-wrap: anywhere; margin-top: 8px; }
    .danger-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid rgba(255, 107, 107, 0.38); border-radius: 10px; padding: 0.8rem 1.1rem; background: #b83f4d; color: #fff; font-size: 0.9rem; font-weight: 700; }
    .danger-button:hover:not(:disabled) { background: #cf4d5c; }
    .danger-button:disabled { cursor: wait; opacity: 0.65; }
    .dialog-panel form { display: grid; gap: 10px; }
    .dialog-panel label { color: var(--muted); font-size: 12px; }
    .dialog-panel input, .dialog-panel select { width: 100%; padding: 10px 12px; border: 1px solid var(--border); background: var(--input-bg); border-radius: 10px; color: var(--text); }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
    .backdrop { position: fixed; inset: 0; background: rgba(4, 8, 12, 0.52); display: grid; place-items: center; z-index: 80; }
    .pager { display: flex; align-items: center; justify-content: center; gap: 12px; padding-top: 10px; }
    .pager button { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border); background: var(--input-bg); color: var(--text); }
    .pager button:disabled { opacity: 0.45; cursor: not-allowed; }
    .no-matches { color: var(--muted); padding: 10px 0 4px; }
    .table-panel table { width: 100%; border-collapse: collapse; }
    .table-panel th, .table-panel td { padding: 12px 10px; border-bottom: 1px solid rgba(117, 145, 168, 0.18); text-align: left; }
    .table-panel small { display: block; color: var(--muted); }
    .table-panel code { color: var(--cyan); }
    .panel-heading a { color: var(--cyan); text-decoration: none; }
    .event { display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(117, 145, 168, 0.18); }
    .event:last-child { border-bottom: 0; }
    .event-dot { width: 8px; height: 8px; border-radius: 50%; background: #54dfc2; margin-top: 6px; }
    .event-dot.blocked { background: var(--red); }
    .event time { margin-left: auto; color: var(--muted); font-size: 11px; text-align: right; }
    .endpoint-row { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(117, 145, 168, 0.18); }
    .endpoint-row:last-child { border-bottom: 0; }
    .endpoint-row code { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text); font-size: 12px; }
    .endpoint-row strong { font-size: 12px; }
    .endpoint-row small { color: var(--muted); font-size: 11px; }
    .empty { color: var(--muted); padding: 10px 0; }
    `
  ],
})
export class PolicyListComponent implements OnInit {
  readonly i18n = inject(TranslationService);
  readonly toast = inject(ToastService);
  private readonly policyService = inject(PolicyService);
  readonly SlidersHorizontal = SlidersHorizontal;
  readonly Search = Search;
  readonly Download = Download;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly Copy = Copy;
  readonly Power = Power;
  readonly Trash2 = Trash2;
  policies: PolicyRow[] = [];
  page = 0;
  totalPages = 0;
  totalElements = 0;
  readonly pageSize = 10;
  loading = true;
  saving = false;
  createDialogOpen = false;
  editingPolicyId: number | null = null;
  searchTerm = '';
  statusFilter = 'All';
  filterOpen = false;
  pendingDeletePolicy: PolicyRow | null = null;
  deleting = false;
  newPolicyName = '';
  newPolicyAlgorithm = 'FIXED_WINDOW';
  newPolicyLimit = 5;
  newPolicyWindow = 'MINUTE';

  ngOnInit(): void { this.loadPage(); }
  loadPage(): void {
    this.loading = true;
    this.policyService.list(this.page, this.pageSize).subscribe({
      next: response => { this.policies = response.content.map(policy => this.toRow(policy)); this.totalPages = response.totalPages; this.totalElements = response.totalElements; this.loading = false; },
      error: () => { this.policies = []; this.loading = false; this.toast.show(this.i18n.translate('policySaveFailed')); }
    });
  }
  previousPage(): void { if (this.page > 0) { this.page--; this.loadPage(); } }
  nextPage(): void { if (this.page + 1 < this.totalPages) { this.page++; this.loadPage(); } }
  createPolicy(): void {
    this.editingPolicyId = null;
    this.newPolicyName = '';
    this.newPolicyAlgorithm = 'FIXED_WINDOW';
    this.newPolicyLimit = 5;
    this.newPolicyWindow = 'MINUTE';
    this.createDialogOpen = true;
  }
  savePolicy(): void {
    const name = this.newPolicyName.trim();
    if (!name || !Number.isInteger(this.newPolicyLimit) || this.newPolicyLimit < 1) return;
    this.saving = true;
    const request = { name, description: this.i18n.translate('policyDescription'), algorithm: this.newPolicyAlgorithm, limit: this.newPolicyLimit, window: this.newPolicyWindow, scope: 'IP_ADDRESS', status: 'ACTIVE', usage: 0, environment: 'PRODUCTION', burst: 0 };
    const saveRequest = this.editingPolicyId === null
      ? this.policyService.create(request)
      : this.policyService.update(this.editingPolicyId, request);
    const wasEditing = this.editingPolicyId !== null;
    saveRequest.subscribe({
      next: () => { this.saving = false; this.createDialogOpen = false; this.editingPolicyId = null; this.toast.show(this.i18n.translate(wasEditing ? 'policyUpdated' : 'policyCreated')); this.loadPage(); },
      error: () => { this.saving = false; this.toast.show(this.i18n.translate('policySaveFailed')); }
    });
  }
  editPolicy(policy: PolicyRow): void {
    this.editingPolicyId = policy.id;
    this.newPolicyName = policy.name;
    this.newPolicyAlgorithm = policy.algo;
    this.newPolicyLimit = Number(policy.limit);
    this.newPolicyWindow = policy.window;
    this.createDialogOpen = true;
  }
  copyPolicy(policy: PolicyRow): void {
    this.policyService.create({ name: `${policy.name} (${this.i18n.translate('copySuffix')})`, description: this.i18n.translate('policyDescription'), algorithm: policy.algo, limit: Number(policy.limit), window: policy.window, scope: policy.scope, status: 'ACTIVE', usage: 0, environment: 'PRODUCTION', burst: 0 }).subscribe({ next: () => { this.toast.show(this.i18n.translate('policyCopied')); this.loadPage(); }, error: () => { this.toast.show(this.i18n.translate('policySaveFailed')); } });
  }
  togglePolicy(policy: PolicyRow): void {
    const status = policy.status === 'Active' ? 'PAUSED' : 'ACTIVE';
    this.policyService.update(policy.id, { status }).subscribe({ next: () => { this.toast.show(this.i18n.translate(status === 'PAUSED' ? 'paused' : 'active')); this.loadPage(); }, error: () => this.toast.show(this.i18n.translate('policySaveFailed')) });
  }
  deletePolicy(policy: PolicyRow): void {
    this.pendingDeletePolicy = policy;
  }
  cancelDelete(): void {
    if (!this.deleting) this.pendingDeletePolicy = null;
  }
  confirmDeletePolicy(): void {
    const policy = this.pendingDeletePolicy;
    if (!policy || this.deleting) return;
    this.deleting = true;
    this.policyService.delete(policy.id).subscribe({
      next: () => { this.deleting = false; this.pendingDeletePolicy = null; this.toast.show(this.i18n.translate('policyDeleted')); this.loadPage(); },
      error: () => { this.deleting = false; this.toast.show(this.i18n.translate('policySaveFailed')); }
    });
  }
  private toRow(policy: PolicyItem): PolicyRow { return { id: policy.id, name: policy.name, algo: policy.algorithm, limit: String(policy.limit), window: policy.window, scope: policy.scope ?? '\u2014', status: /PAUSED/i.test(policy.status) ? 'Paused' : 'Active' }; }

  closePolicyDialog(): void {
    this.createDialogOpen = false;
    this.editingPolicyId = null;
  }

  visiblePolicies(): PolicyRow[] {
    const query = this.searchTerm.trim().toLocaleLowerCase();
    return this.policies.filter((policy) => {
      const matchesStatus = this.statusFilter === 'All' || policy.status === this.statusFilter;
      const matchesSearch = !query || `${policy.name} ${policy.algo} ${policy.limit} ${policy.scope}`.toLocaleLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }

  countStatus(status: string): number {
    return this.policies.filter((policy) => policy.status === status).length;
  }

  windowLabel(window: string): string {
    const key = { SECOND: 'perSecond', MINUTE: 'perMinute', HOUR: 'perHour', DAY: 'perDay' }[window as 'SECOND' | 'MINUTE' | 'HOUR' | 'DAY'];
    return key ? this.i18n.translate(key) : window;
  }

  exportPolicies(): void {
    const quote = (value: string): string => `"${value.replaceAll('"', '""')}"`;
    const rows = [
      ['policyColumn', 'algorithm', 'requestLimit', 'window', 'status'].map((key) => quote(this.i18n.translate(key))).join(','),
      ...this.visiblePolicies().map((policy) => [policy.name, this.algorithmLabel(policy.algo), policy.limit, this.windowLabel(policy.window), this.i18n.translate(policy.status === 'Active' ? 'active' : 'paused')].map(quote).join(','))
    ];
    const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'policies.csv';
    link.click();
    URL.revokeObjectURL(url);
    this.toast.show(this.i18n.translate('exportSucceeded'));
  }

  algorithmLabel(algorithm: string): string {
    const key = { FIXED_WINDOW: 'fixedWindow', TOKEN_BUCKET: 'tokenBucket', SLIDING_WINDOW: 'slidingWindow' }[algorithm as 'FIXED_WINDOW' | 'TOKEN_BUCKET' | 'SLIDING_WINDOW'];
    return key ? this.i18n.translate(key) : algorithm;
  }
}

