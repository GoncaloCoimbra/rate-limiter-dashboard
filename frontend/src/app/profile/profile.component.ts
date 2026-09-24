import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../shared/theme.service';
import { ToastService } from '../shared/toast.service';
import { ProfileStateService } from '../shared/profile-state.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="profile-page">
      <header class="page-header">
        <div>
          <p>WORKSPACE</p>
          <h1>Perfil</h1>
          <span>Gere os dados da sua conta e preferências pessoais.</span>
        </div>
      </header>

      <article class="profile-card">
        <div class="identity">
          <div class="avatar-wrap"><img *ngIf="profileState.photo()" class="large-avatar photo" [src]="profileState.photo()" alt="Foto de perfil" /><div *ngIf="!profileState.photo()" class="large-avatar" aria-hidden="true">{{ profileState.name().charAt(0) }}</div><label *ngIf="editing()" class="photo-button">Trocar foto<input type="file" accept="image/png,image/jpeg,image/webp" (change)="changePhoto($event)" /></label></div>
          <div *ngIf="!editing()">
            <h2>{{ profileState.name() }}</h2>
            <p>Administrador</p>
            <span>{{ profileState.email() }}</span>
          </div>
          <form class="edit-form" *ngIf="editing()" (ngSubmit)="saveProfile()">
            <input name="profileName" [(ngModel)]="draftName" aria-label="Nome" required />
            <input name="profileEmail" [(ngModel)]="draftEmail" type="email" aria-label="Email" required />
          </form>
          <div class="edit-actions">
            <button *ngIf="!editing()" type="button" class="edit" (click)="editProfile()">Editar perfil</button>
            <ng-container *ngIf="editing()"><button type="button" class="cancel" (click)="cancelEdit()">Cancelar</button><button type="button" class="edit" (click)="saveProfile()">Guardar alterações</button></ng-container>
          </div>
        </div>

        <div class="stats">
          <span>Membro desde <strong>Jan 2024</strong></span>
          <span>Último acesso: <strong>hoje</strong></span>
        </div>

        <div class="preferences">
          <h2>Preferências</h2>

          <label>
            <span>
              <strong>Notificações por email</strong>
              <small>Receber atualizações importantes do workspace</small>
            </span>
            <input
              type="checkbox"
              role="switch"
              [ngModel]="emailNotifications()"
              (ngModelChange)="setEmailNotifications($event)"
            />
          </label>

          <label>
            <span>
              <strong>Modo escuro</strong>
              <small>Usar o tema escuro na aplicação</small>
            </span>
            <input
              type="checkbox"
              role="switch"
              [ngModel]="!theme.isLight()"
              (ngModelChange)="theme.setLight(!$event)"
            />
          </label>
        </div>
      </article>
    </section>
  `,
  styles: [`
    :host { display: block; }

    .profile-page { display: grid; gap: 22px; max-width: 900px; }

    .page-header p {
      color: var(--cyan);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: .14em;
      margin: 0 0 9px;
    }
    .page-header h1 {
      font: 500 34px 'Space Grotesk', system-ui, sans-serif;
      margin: 0;
    }
    .page-header span,
    .identity p,
    .identity > div > span,
    .stats { color: var(--muted); font-size: 13px; }
    .page-header span { display: block; margin-top: 9px; }

    .profile-card {
      border: 1px solid var(--border);
      background: var(--card);
      border-radius: 10px;
      padding: 28px;
    }

    .identity { display: flex; align-items: center; gap: 18px; }
    .avatar-wrap { position: relative; display: grid; gap: 8px; justify-items: center; flex-shrink: 0; }
    .large-avatar {
      width: 64px;
      height: 64px;
      flex-shrink: 0;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: var(--cyan);
      color: #09252a;
      font: 600 26px 'Space Grotesk', system-ui, sans-serif;
    }
    .large-avatar.photo { object-fit: cover; }
    .photo-button { color: var(--cyan); font-size: 11px; font-weight: 700; cursor: pointer; white-space: nowrap; }
    .photo-button input { display: none; }
    .identity h2 {
      margin: 0;
      font: 500 22px 'Space Grotesk', system-ui, sans-serif;
    }
    .identity p { margin: 5px 0; }
    .identity > div > span { font-size: 12px; }

    .edit-form { display: grid; gap: 7px; min-width: min(360px, 52vw); }
    .edit-form input { border: 1px solid var(--border); border-radius: 7px; padding: 9px 10px; background: var(--input-bg); color: var(--text); }
    .edit-actions { margin-left: auto; display: flex; gap: 8px; align-items: center; }

    .edit {
      margin-left: auto;
      border: 0;
      border-radius: 7px;
      background: var(--cyan);
      color: #06242a;
      font-weight: 700;
      padding: 11px 14px;
      cursor: pointer;
    }
    .edit:focus-visible { outline: 2px solid var(--text); outline-offset: 2px; }
    .cancel { border: 1px solid var(--border); border-radius: 7px; background: transparent; color: var(--text); padding: 10px 12px; cursor: pointer; }

    .stats {
      display: flex;
      gap: 30px;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      padding: 18px 0;
      margin: 26px 0;
    }
    .stats strong { color: var(--text); font-weight: 500; }

    .preferences { display: grid; gap: 4px; }
    .preferences h2 {
      font: 500 17px 'Space Grotesk', system-ui, sans-serif;
      margin: 0 0 10px;
    }
    .preferences label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 14px 0;
      border-bottom: 1px solid var(--border);
      cursor: pointer;
    }
    .preferences label span { display: grid; gap: 5px; }
    .preferences small { color: var(--muted); font-size: 11px; }

    .preferences input {
      appearance: none;
      flex-shrink: 0;
      width: 38px;
      height: 20px;
      margin: 0;
      background: #34424a;
      border-radius: 20px;
      position: relative;
      cursor: pointer;
      transition: background .2s;
    }
    .preferences input:checked { background: var(--cyan); }
    .preferences input:focus-visible { outline: 2px solid var(--cyan); outline-offset: 3px; }
    .preferences input::after {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      top: 2px;
      left: 2px;
      border-radius: 50%;
      background: #fff;
      transition: left .2s;
    }
    .preferences input:checked::after { left: 20px; }

    @media (prefers-reduced-motion: reduce) {
      .preferences input,
      .preferences input::after { transition: none; }
    }

    @media (max-width: 600px) {
      .identity { align-items: start; flex-wrap: wrap; }
      .edit { margin-left: 0; }
      .stats { flex-direction: column; gap: 10px; }
    }
  `]
})
export class ProfileComponent {
  readonly theme = inject(ThemeService);
  readonly toast = inject(ToastService);
  readonly editing = signal(false);
  readonly profileState = inject(ProfileStateService);
  readonly emailNotifications = signal(localStorage.getItem('email-notifications') !== 'false');
  draftName = this.profileState.name();
  draftEmail = this.profileState.email();
  private originalPhoto: string | null = this.profileState.photo();

  editProfile(): void {
    this.draftName = this.profileState.name();
    this.draftEmail = this.profileState.email();
    this.originalPhoto = this.profileState.photo();
    this.editing.set(true);
  }
  cancelEdit(): void {
    this.draftName = this.profileState.name();
    this.draftEmail = this.profileState.email();
    if (this.profileState.photo() !== this.originalPhoto) {
      if (this.originalPhoto) this.profileState.updatePhoto(this.originalPhoto);
      else { this.profileState.photo.set(null); localStorage.removeItem('profile-photo'); }
    }
    this.editing.set(false);
    this.toast.show('Alterações canceladas');
  }
  saveProfile(): void {
    if (!this.draftName.trim() || !this.draftEmail.trim()) { this.toast.show('Preencha o nome e o email'); return; }
    this.profileState.update(this.draftName.trim(), this.draftEmail.trim());
    this.originalPhoto = this.profileState.photo();
    this.editing.set(false);
    this.toast.show('Perfil atualizado');
  }
  setEmailNotifications(enabled: boolean): void {
    this.emailNotifications.set(enabled);
    localStorage.setItem('email-notifications', String(enabled));
    this.toast.show(enabled ? 'Notificações por email ativadas' : 'Notificações por email desativadas');
  }
  changePhoto(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.toast.show('Escolha uma imagem válida'); return; }
    const reader = new FileReader();
    reader.onload = () => { this.profileState.updatePhoto(String(reader.result)); this.toast.show('Foto atualizada'); };
    reader.readAsDataURL(file);
  }
}