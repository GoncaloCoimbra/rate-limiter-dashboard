import { CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from './auth.service';
import { Locale, TranslationService } from '../shared/translation.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <section class="auth-visual" aria-labelledby="recovery-visual-title">
        <a class="brand" routerLink="/login" [attr.aria-label]="text('brandAria', 'ratelimiter — voltar ao login')">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M7 18V9M12 18V5M17 18v-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
            </svg>
          </span>
          <span>ratelimiter</span>
        </a>

        <div class="visual-content">
          <p class="eyebrow">{{ text('recoverAccess', 'RECUPERE O ACESSO') }}</p>
          <h1 id="recovery-visual-title">{{ text('recoveryHeadline', 'Volte ao controlo com segurança.') }}</h1>
          <p class="visual-copy">
            {{ text('recoveryVisualCopy', 'Recupere o acesso sem expor credenciais. Enviamos os próximos passos para o email da conta.') }}
          </p>

          <div class="security-card" [attr.aria-label]="text('securityInfo', 'Informação de segurança')">
            <div class="security-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 3 19 6v5c0 4.6-2.8 8.6-7 10-4.2-1.4-7-5.4-7-10V6l7-3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="m9.3 12 1.8 1.8 3.8-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="security-body">
              <strong>{{ text('recoveryPrivate', 'Pedido protegido') }}</strong>
              <span>{{ text('recoveryPrivateCopy', 'A resposta é igual exista ou não uma conta com esse email.') }}</span>
            </div>
            <span class="security-seal" aria-hidden="true">
              <i></i>
              {{ text('sealed', 'SEALED') }}
            </span>
          </div>

          <div class="recovery-flow" aria-hidden="true">
            <div class="recovery-step active" data-step="01">
              <span class="step-index">01</span>
              <span class="step-copy">
                <b>VERIFY</b>
                <small>{{ text('stepVerify', 'Email seguro') }}</small>
              </span>
              <span class="step-pulse"></span>
            </div>
            <span class="flow-line"><i></i></span>
            <div class="recovery-step">
              <span class="step-index">02</span>
              <span class="step-copy">
                <b>DELIVER</b>
                <small>{{ text('stepDeliver', 'Link protegido') }}</small>
              </span>
            </div>
            <span class="flow-line"><i></i></span>
            <div class="recovery-step">
              <span class="step-index">03</span>
              <span class="step-copy">
                <b>RESTORE</b>
                <small>{{ text('stepRestore', 'Acesso retomado') }}</small>
              </span>
            </div>
          </div>
        </div>

        <small class="visual-footer">© 2026 ratelimiter</small>
      </section>

      <section class="auth-panel">
        <header class="auth-top">
          <div class="language-switch" role="group" [attr.aria-label]="text('language', 'Idioma')">
            @for (locale of availableLocales; track locale.value) {
              <button
                type="button"
                class="language-option"
                [class.active]="i18n.locale() === locale.value"
                [attr.aria-pressed]="i18n.locale() === locale.value"
                (click)="onLanguageChange(locale.value)"
              >
                {{ locale.label }}
              </button>
            }
          </div>
        </header>

        <div class="auth-content">
          @if (!requestSent()) {
            <div class="auth-heading">
              <a routerLink="/login" class="back-link">
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="m12.5 5-5 5 5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                {{ text('backToLogin', 'Voltar ao login') }}
              </a>
              <p class="eyebrow">{{ text('recovery', 'RECUPERAÇÃO') }}</p>
              <h2>{{ text('forgotPasswordTitle', 'Recuperar password') }}</h2>
              <p class="intro">
                {{ text('forgotPasswordIntro', 'Indique o email da sua conta. Enviaremos instruções para recuperar o acesso.') }}
              </p>
            </div>

            <form
              class="auth-form"
              [formGroup]="recoveryForm"
              (ngSubmit)="recover()"
              novalidate
              aria-describedby="recovery-note"
            >
              <div class="field-group">
                <label for="email" class="field-label">
                  {{ text('email', 'Email') }}
                  <span aria-hidden="true">*</span>
                </label>

                <div class="input-wrap">
                  <svg class="input-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" stroke="currentColor" stroke-width="1.7"/>
                    <path d="m5 8 7 5 7-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <input
                    #emailInput
                    id="email"
                    class="form-input with-icon"
                    type="email"
                    formControlName="email"
                    autocomplete="email"
                    inputmode="email"
                    spellcheck="false"
                    autocapitalize="none"
                    [placeholder]="text('emailPlaceholder', 'nome@empresa.pt')"
                    [class.invalid]="isEmailInvalid()"
                    [attr.aria-invalid]="isEmailInvalid()"
                    [attr.aria-describedby]="isEmailInvalid() ? 'email-error recovery-note' : 'recovery-note'"
                  />
                </div>

                @if (isEmailInvalid()) {
                  <p id="email-error" class="field-error" role="alert">
                    {{ getEmailError() }}
                  </p>
                }
              </div>

              <p id="recovery-note" class="privacy-note">
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M10 2.8 16 5.3v4.3c0 3.7-2.4 6.7-6 7.9-3.6-1.2-6-4.2-6-7.9V5.3l6-2.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
                  <path d="M7.6 10.1 9.2 11.7l3.3-3.3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>{{ text('privacyNote', 'Por segurança, não revelamos se o email está associado a uma conta.') }}</span>
              </p>

              @if (errorMessage()) {
                <div class="message error-message" role="alert" aria-live="assertive">
                  <div class="message-icon" aria-hidden="true">
                    <svg viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/>
                      <path d="M10 6.5v4.2M10 13.6h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
                    </svg>
                  </div>
                  <p>{{ errorMessage() }}</p>
                </div>
              }

              <button
                class="submit-button"
                type="submit"
                [disabled]="loading()"
                [attr.aria-busy]="loading()"
              >
                @if (loading()) {
                  <span class="button-spinner" aria-hidden="true"></span>
                  <span class="button-label">{{ text('sending', 'A enviar…') }}</span>
                } @else {
                  <span class="button-label">{{ text('sendInstructions', 'Enviar instruções') }}</span>
                  <svg class="button-arrow" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M4.5 10h10M10.5 5.5 15 10l-4.5 4.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                }
              </button>
            </form>

            <p class="auth-switch">
              {{ text('rememberedPassword', 'Lembrou-se da password?') }}
              <a routerLink="/login">{{ text('signIn', 'Entrar') }}</a>
            </p>
          } @else {
            <section class="success-state" aria-live="polite" aria-labelledby="recovery-success-title">
              <div class="success-mark" aria-hidden="true">
                <span class="success-ring"></span>
                <span class="success-ring delay"></span>
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="m7 12.4 3.2 3.2L17.5 8.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <p class="eyebrow">{{ text('requestSent', 'PEDIDO ENVIADO') }}</p>
              <h2 id="recovery-success-title">{{ text('checkYourEmail', 'Verifique o seu email.') }}</h2>
              <p class="success-copy">
                {{ text('checkYourEmailCopy', 'Se existir uma conta para este endereço, receberá em breve instruções para redefinir a password.') }}
              </p>

              <div class="email-pill">
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="2.8" y="4.3" width="14.4" height="11.4" rx="2" stroke="currentColor" stroke-width="1.4"/>
                  <path d="m4 6.5 6 4.1 6-4.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>{{ submittedEmail() }}</span>
              </div>

              <p class="success-hint">
                {{ text('deliveryHint', 'Não encontrou o email? Verifique a pasta de spam ou tente novamente em alguns minutos.') }}
              </p>

              <button type="button" class="secondary-button" (click)="startOver()">
                {{ text('useAnotherEmail', 'Usar outro email') }}
              </button>

              <p class="auth-switch">
                <a routerLink="/login">{{ text('backToLogin', 'Voltar ao login') }}</a>
              </p>
            </section>
          }
        </div>
      </section>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100dvh;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #102a43;
    }

    * { box-sizing: border-box; }

    .auth-page {
      min-height: 100dvh;
      display: grid;
      grid-template-columns: minmax(420px, 0.95fr) minmax(480px, 1.05fr);
      background: #f7fafc;
    }

    .auth-visual {
      position: relative;
      isolation: isolate;
      overflow: hidden;
      min-height: 100dvh;
      padding: clamp(32px, 5vw, 76px);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background:
        radial-gradient(circle at 78% 18%, rgba(63, 201, 214, .16), transparent 28%),
        radial-gradient(circle at 12% 82%, rgba(10, 130, 166, .18), transparent 34%),
        linear-gradient(150deg, #082c46 0%, #073e5c 52%, #075b76 100%);
      color: #f4fbff;
    }

    .auth-visual::before {
      content: "";
      position: absolute;
      inset: 0;
      z-index: -1;
      opacity: .24;
      background-image:
        linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px);
      background-size: 34px 34px;
      mask-image: linear-gradient(to bottom, black, transparent 78%);
      pointer-events: none;
    }

    .auth-visual::after {
      content: "";
      position: absolute;
      width: 520px;
      height: 520px;
      right: -300px;
      bottom: -250px;
      border: 1px solid rgba(120,231,235,.10);
      border-radius: 50%;
      box-shadow:
        0 0 0 44px rgba(120,231,235,.025),
        0 0 0 92px rgba(120,231,235,.018);
      pointer-events: none;
    }

    .brand {
      display: inline-flex;
      width: fit-content;
      align-items: center;
      gap: 11px;
      color: inherit;
      text-decoration: none;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -.02em;
    }

    .brand-mark {
      width: 35px;
      height: 35px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 11px;
      color: #0b3b51;
      background: #68dce5;
      box-shadow: 0 10px 28px rgba(0,0,0,.16);
    }

    .brand-mark svg { width: 20px; height: 20px; }

    .brand:focus-visible,
    .back-link:focus-visible,
    .auth-switch a:focus-visible,
    .secondary-button:focus-visible,
    .submit-button:focus-visible,
    .language-option:focus-visible {
      outline: 3px solid rgba(74, 212, 225, .42);
      outline-offset: 3px;
      border-radius: 8px;
    }

    .visual-content {
      width: min(520px, 100%);
      margin: auto 0;
      padding-block: 64px;
    }

    .eyebrow {
      margin: 0 0 13px;
      color: #1697b8;
      font-size: 10px;
      font-weight: 800;
      line-height: 1.2;
      letter-spacing: .18em;
      text-transform: uppercase;
    }

    .auth-visual .eyebrow { color: #77e1e9; }

    .auth-visual h1 {
      max-width: 520px;
      margin: 0;
      font-size: clamp(40px, 4.8vw, 70px);
      line-height: 1.01;
      letter-spacing: -.055em;
      font-weight: 580;
    }

    .visual-copy {
      max-width: 470px;
      margin: 22px 0 0;
      color: #b9dce7;
      font-size: 15px;
      line-height: 1.65;
    }

    .security-card {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 13px;
      width: min(460px, 100%);
      margin-top: 30px;
      padding: 16px 18px;
      border: 1px solid rgba(151, 234, 241, .14);
      border-radius: 16px;
      background: rgba(7, 32, 48, .28);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.05);
      backdrop-filter: blur(9px);
    }

    .security-icon {
      flex: 0 0 36px;
      width: 36px;
      height: 36px;
      display: grid;
      place-items: center;
      border-radius: 11px;
      color: #79e2ea;
      background: rgba(97, 222, 229, .10);
    }

    .security-icon svg { width: 19px; height: 19px; }

    .security-body { min-width: 0; }

    .security-body strong,
    .security-body span { display: block; }

    .security-body strong {
      margin-bottom: 4px;
      color: #effcff;
      font-size: 13px;
      font-weight: 700;
    }

    .security-body span {
      color: #aacfd9;
      font-size: 12px;
      line-height: 1.5;
    }

    .security-seal {
      position: absolute;
      top: 12px;
      right: 14px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: rgba(151,234,241,.62);
      font-size: 8px;
      font-weight: 800;
      letter-spacing: .14em;
    }

    .security-seal i {
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: #78e7eb;
      box-shadow: 0 0 0 4px rgba(120,231,235,.08);
      animation: pulse-dot 2.4s ease-in-out infinite;
    }

    .recovery-flow {
      position: relative;
      display: grid;
      grid-template-columns: auto 1fr auto 1fr auto;
      align-items: center;
      width: min(470px, 100%);
      margin-top: 16px;
      padding: 13px 14px;
      border: 1px solid rgba(151,234,241,.11);
      border-radius: 15px;
      background: rgba(4,31,46,.22);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
      backdrop-filter: blur(8px);
    }

    .recovery-step {
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      color: rgba(180,222,229,.40);
    }

    .step-index {
      width: 25px;
      height: 25px;
      flex: 0 0 25px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(151,234,241,.10);
      border-radius: 8px;
      color: rgba(180,222,229,.42);
      background: rgba(255,255,255,.025);
      font-size: 7px;
      font-weight: 800;
      letter-spacing: .05em;
    }

    .step-copy b,
    .step-copy small { display: block; }

    .step-copy b {
      color: rgba(205,244,246,.48);
      font-size: 7px;
      letter-spacing: .11em;
    }

    .step-copy small {
      margin-top: 2px;
      color: rgba(170,210,218,.38);
      font-size: 8px;
    }

    .recovery-step.active .step-index {
      color: #0b4d64;
      border-color: rgba(119,232,235,.35);
      background: #78e7eb;
      box-shadow: 0 0 0 5px rgba(119,232,235,.06);
    }

    .recovery-step.active .step-copy b { color: #b7f5f5; }
    .recovery-step.active .step-copy small { color: rgba(201,242,246,.62); }

    .recovery-step.active .step-pulse {
      position: absolute;
      inset: -4px;
      border-radius: 12px;
      border: 1px solid rgba(120,231,235,.22);
      animation: recovery-pulse 2.8s ease-out infinite;
      pointer-events: none;
    }

    .flow-line {
      position: relative;
      height: 1px;
      margin: 0 8px;
      background: linear-gradient(90deg, rgba(117,232,235,.28), rgba(117,232,235,.06));
      overflow: hidden;
    }

    .flow-line i {
      position: absolute;
      inset: 0 auto 0 -40%;
      width: 40%;
      background: linear-gradient(90deg, transparent, rgba(121,234,237,.72), transparent);
      animation: recovery-flow 3.8s linear infinite;
    }

    .flow-line:nth-of-type(2) i { animation-delay: -1.9s; }

    .visual-footer {
      color: #83aebc;
      font-size: 11px;
    }

    .auth-panel {
      min-height: 100dvh;
      display: grid;
      grid-template-rows: auto 1fr;
      padding: clamp(22px, 3vw, 42px) clamp(24px, 5vw, 84px);
      background: #f7fafc;
    }

    .auth-panel:has(.form-input:focus) {
      background:
        radial-gradient(circle at 70% 35%, rgba(22,151,184,.045), transparent 30%),
        #f7fafc;
    }

    .auth-top {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
    }

    .language-switch {
      display: inline-flex;
      align-items: center;
      padding: 3px;
      border: 1px solid #d7e1e8;
      border-radius: 10px;
      background: rgba(255,255,255,0.72);
    }

    .language-option {
      min-height: 30px;
      padding: 0 9px;
      border: 0;
      border-radius: 7px;
      color: #748593;
      background: transparent;
      font-size: 10px;
      font-weight: 700;
      cursor: pointer;
      transition: background .15s ease, color .15s ease;
    }

    .language-option.active {
      color: #0d546f;
      background: #e7f5f8;
    }

    .auth-content {
      width: min(455px, 100%);
      margin: auto;
      padding-block: 46px 28px;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      margin-bottom: 52px;
      color: #61778a;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      transition: color .15s ease;
    }

    .back-link:hover { color: #0b7895; }
    .back-link svg { width: 16px; height: 16px; }

    .auth-heading h2,
    .success-state h2 {
      margin: 0;
      color: #102a43;
      font-size: clamp(34px, 4vw, 48px);
      line-height: 1.04;
      letter-spacing: -.05em;
      font-weight: 600;
    }

    .intro,
    .success-copy {
      max-width: 420px;
      margin: 14px 0 0;
      color: #63798b;
      font-size: 14px;
      line-height: 1.65;
    }

    .auth-form {
      display: grid;
      gap: 18px;
      margin-top: 34px;
    }

    .field-group {
      display: grid;
      gap: 8px;
    }

    .field-label {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #263f55;
      font-size: 12px;
      font-weight: 700;
    }

    .field-label span { color: #d25b6f; }

    .input-wrap { position: relative; }

    .input-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      width: 19px;
      height: 19px;
      color: #8da0af;
      transform: translateY(-50%);
      pointer-events: none;
    }

    .form-input {
      width: 100%;
      min-height: 54px;
      padding: 0 16px;
      border: 1px solid #d5e0e8;
      border-radius: 13px;
      outline: none;
      background: #ffffff;
      color: #102a43;
      font: inherit;
      font-size: 14px;
      transition: border-color .16s ease, box-shadow .16s ease, background-color .16s ease;
    }

    .form-input.with-icon { padding-left: 46px; }
    .form-input::placeholder { color: #aab8c4; }
    .form-input:hover { border-color: #bccedb; }

    .form-input:focus {
      border-color: #10a0b9;
      box-shadow: 0 0 0 4px rgba(16, 160, 185, .10);
    }

    .form-input.invalid {
      border-color: #d95e72;
      box-shadow: 0 0 0 4px rgba(217, 94, 114, .07);
    }

    .field-error {
      margin: 0;
      color: #b6465d;
      font-size: 12px;
      line-height: 1.4;
    }

    .privacy-note {
      display: flex;
      align-items: flex-start;
      gap: 9px;
      margin: 0;
      color: #718696;
      font-size: 11px;
      line-height: 1.55;
    }

    .privacy-note svg {
      flex: 0 0 18px;
      width: 18px;
      height: 18px;
      margin-top: -1px;
      color: #4d8797;
    }

    .message {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 13px;
      border-radius: 12px;
      font-size: 12px;
      line-height: 1.5;
      animation: slide-down 180ms ease-out;
    }

    .error-message {
      border: 1px solid #f1c1ca;
      background: #fff2f4;
      color: #a63f53;
    }

    .message p { margin: 1px 0 0; }

    .message-icon {
      flex: 0 0 19px;
      width: 19px;
      height: 19px;
    }

    /* ─────────────────────────────────────────────────────────────
       SUBMIT BUTTON — CORREÇÃO
       Sem largura/altura explícitas, o SVG estica em contexto flex
       e empurra o texto para a esquerda. Aqui fixamos as dimensões
       do ícone e impedimos o label de quebrar.
    ───────────────────────────────────────────────────────────── */

    .submit-button {
      width: 100%;
      min-height: 50px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      margin-top: 2px;
      padding-inline: 18px;
      border: 1px solid #0d7896;
      border-radius: 12px;
      color: #fff;
      background: linear-gradient(180deg, #1187a6 0%, #0b7897 100%);
      box-shadow:
        0 8px 18px rgba(11, 120, 151, 0.17),
        inset 0 1px 0 rgba(255,255,255,0.18);
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      transition:
        transform 150ms ease,
        box-shadow 150ms ease,
        background 150ms ease,
        opacity 150ms ease;
    }

    .submit-button .button-label {
      flex: 0 1 auto;
      min-width: 0;
      white-space: nowrap;
      line-height: 1;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .submit-button .button-arrow {
      flex: 0 0 16px;
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.7;
      stroke-linecap: round;
      stroke-linejoin: round;
      transition: transform 180ms ease;
    }

    .submit-button:hover:not(:disabled) {
      transform: translateY(-1px);
      background: linear-gradient(180deg, #1390af 0%, #0c7897 100%);
      box-shadow:
        0 11px 22px rgba(11, 120, 151, 0.21),
        inset 0 1px 0 rgba(255,255,255,0.18);
    }

    .submit-button:hover:not(:disabled) .button-arrow {
      transform: translateX(2px);
    }

    .submit-button:active:not(:disabled) { transform: translateY(0); }

    .submit-button:disabled {
      background: #d4e2e9;
      border-color: #d4e2e9;
      color: #fff;
      cursor: not-allowed;
      box-shadow: none;
    }

    .button-spinner {
      flex: 0 0 16px;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,.34);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin .7s linear infinite;
    }

    .secondary-button {
      display: block;
      width: 100%;
      min-height: 50px;
      margin-top: 20px;
      border: 1px solid #cddce5;
      border-radius: 12px;
      background: #ffffff;
      color: #24445e;
      font: inherit;
      font-size: 13px;
      font-weight: 750;
      cursor: pointer;
      transition: border-color .15s ease, background .15s ease, transform .15s ease;
    }

    .secondary-button:hover {
      border-color: #aac3d0;
      background: #fbfdfe;
      transform: translateY(-1px);
    }

    .auth-switch {
      margin: 28px 0 0;
      color: #718696;
      text-align: center;
      font-size: 12px;
    }

    .auth-switch a {
      color: #0a7895;
      font-weight: 750;
      text-decoration: none;
    }

    .auth-switch a:hover {
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    .success-state {
      text-align: center;
      padding-top: 34px;
      animation: rise 320ms ease-out;
    }

    .success-state .eyebrow { margin-top: 26px; }

    .success-mark {
      position: relative;
      width: 64px;
      height: 64px;
      display: grid;
      place-items: center;
      margin: 0 auto;
      border: 1px solid #c4ece3;
      border-radius: 18px;
      color: #087f78;
      background: #e9f9f5;
    }

    .success-mark svg { width: 28px; height: 28px; }

    .success-ring {
      position: absolute;
      inset: -1px;
      border: 1px solid rgba(8, 127, 120, .28);
      border-radius: 20px;
      animation: success-ripple 2.4s ease-out infinite;
      pointer-events: none;
    }

    .success-ring.delay { animation-delay: 1.2s; }

    .success-copy { margin-inline: auto; }

    .email-pill {
      width: fit-content;
      max-width: 100%;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin: 24px auto 0;
      padding: 9px 12px;
      border: 1px solid #dfe8ee;
      border-radius: 999px;
      background: #ffffff;
      color: #375267;
      font-size: 12px;
      box-shadow: 0 2px 6px rgba(15,43,66,.04);
    }

    .email-pill svg {
      width: 17px;
      height: 17px;
      color: #49879a;
    }

    .success-hint {
      max-width: 380px;
      margin: 16px auto 0;
      color: #8fa0ad;
      font-size: 11px;
      line-height: 1.55;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slide-down {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes rise {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: .55; transform: scale(.9); }
      50% { opacity: 1; transform: scale(1.15); }
    }
    @keyframes recovery-flow {
      to { transform: translateX(350%); }
    }
    @keyframes recovery-pulse {
      0% { opacity: .8; transform: scale(1); }
      100% { opacity: 0; transform: scale(1.08); }
    }
    @keyframes success-ripple {
      0% { opacity: .7; transform: scale(1); }
      100% { opacity: 0; transform: scale(1.18); }
    }

    @media (max-width: 900px) {
      .auth-page { grid-template-columns: 1fr; }
      .auth-visual { min-height: auto; padding: 26px 24px 30px; }
      .visual-content { margin: 54px 0 30px; padding: 0; }
      .auth-visual h1 { max-width: 680px; font-size: clamp(38px, 8vw, 58px); }
      .security-card, .visual-copy { max-width: 680px; }
      .auth-panel { min-height: auto; padding: 22px 24px 42px; }
      .auth-content { padding-top: 36px; }
    }

    @media (max-width: 560px) {
      .visual-footer { display: none; }
      .auth-panel { padding-inline: 18px; }
      .auth-top { justify-content: space-between; }
      .auth-content { padding-top: 28px; }
      .back-link { margin-bottom: 36px; }
      .auth-heading h2, .success-state h2 { font-size: 34px; }
      .submit-button { font-size: 12.5px; gap: 7px; }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: .01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: .01ms !important;
      }
    }
  `],
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  readonly i18n = inject(TranslationService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly document = inject(DOCUMENT);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('emailInput') private emailInput?: ElementRef<HTMLInputElement>;

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly submittedEmail = signal('');
  readonly requestSent = signal(false);

  readonly recoveryForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly availableLocales: Array<{ value: Locale; label: string }> = [
    { value: 'pt', label: 'PT' },
    { value: 'en', label: 'EN' },
    { value: 'zh', label: '中文' },
  ];

  ngOnInit(): void {
    queueMicrotask(() => this.emailInput?.nativeElement.focus());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  text(
    key: string,
    fallback: string,
    vars: Record<string, string | number> = {},
  ): string {
    const translated = this.i18n.translate(key);

    if (translated && translated !== key) {
      return this.interpolate(translated, vars);
    }

    const locale = String(this.i18n.locale());
    const fallbacks: Record<string, Record<string, string>> = {
      pt: {
        brandAria: 'ratelimiter — voltar ao login',
        language: 'Idioma',
        recoverAccess: 'RECUPERE O ACESSO',
        recoveryHeadline: 'Volte ao controlo com segurança.',
        recoveryVisualCopy:
          'Recupere o acesso sem expor credenciais. Enviamos os próximos passos para o email da conta.',
        securityInfo: 'Informação de segurança',
        recoveryPrivate: 'Pedido protegido',
        recoveryPrivateCopy:
          'A resposta é igual exista ou não uma conta com esse email.',
        sealed: 'SEALED',
        stepVerify: 'Email seguro',
        stepDeliver: 'Link protegido',
        stepRestore: 'Acesso retomado',
        backToLogin: 'Voltar ao login',
        recovery: 'RECUPERAÇÃO',
        forgotPasswordTitle: 'Recuperar password',
        forgotPasswordIntro:
          'Indique o email da sua conta. Enviaremos instruções para recuperar o acesso.',
        email: 'Email',
        emailPlaceholder: 'nome@empresa.pt',
        privacyNote:
          'Por segurança, não revelamos se o email está associado a uma conta.',
        sending: 'A enviar…',
        sendInstructions: 'Enviar instruções',
        rememberedPassword: 'Lembrou-se da password?',
        signIn: 'Entrar',
        requestSent: 'PEDIDO ENVIADO',
        checkYourEmail: 'Verifique o seu email.',
        checkYourEmailCopy:
          'Se existir uma conta para este endereço, receberá em breve instruções para redefinir a password.',
        deliveryHint:
          'Não encontrou o email? Verifique a pasta de spam ou tente novamente em alguns minutos.',
        useAnotherEmail: 'Usar outro email',
        emailRequired: 'Indique o seu email.',
        invalidEmail: 'Introduza um email válido.',
        invalidField: 'Verifique este campo.',
        networkError:
          'Não foi possível contactar o servidor. Verifique a sua ligação e tente novamente.',
        recoveryGenericError:
          'Não foi possível processar o pedido neste momento. Tente novamente.',
      },
      en: {
        brandAria: 'ratelimiter — back to sign in',
        language: 'Language',
        recoverAccess: 'RECOVER ACCESS',
        recoveryHeadline: 'Get back in control, securely.',
        recoveryVisualCopy:
          'Recover access without exposing credentials. We will send the next steps to the account email.',
        securityInfo: 'Security information',
        recoveryPrivate: 'Protected request',
        recoveryPrivateCopy:
          'The response is the same whether or not an account exists for this email.',
        sealed: 'SEALED',
        stepVerify: 'Secure email',
        stepDeliver: 'Protected link',
        stepRestore: 'Access restored',
        backToLogin: 'Back to sign in',
        recovery: 'RECOVERY',
        forgotPasswordTitle: 'Reset password',
        forgotPasswordIntro:
          'Enter your account email. We will send instructions to recover access.',
        email: 'Email',
        emailPlaceholder: 'name@company.com',
        privacyNote:
          'For security, we do not reveal whether this email is associated with an account.',
        sending: 'Sending…',
        sendInstructions: 'Send instructions',
        rememberedPassword: 'Remember your password?',
        signIn: 'Sign in',
        requestSent: 'REQUEST SENT',
        checkYourEmail: 'Check your email.',
        checkYourEmailCopy:
          'If an account exists for this address, you will receive instructions to reset your password shortly.',
        deliveryHint:
          'Didn’t get the email? Check your spam folder or try again in a few minutes.',
        useAnotherEmail: 'Use another email',
        emailRequired: 'Enter your email.',
        invalidEmail: 'Enter a valid email address.',
        invalidField: 'Check this field.',
        networkError:
          'The server could not be reached. Check your connection and try again.',
        recoveryGenericError:
          'We could not process the request right now. Please try again.',
      },
      zh: {
        brandAria: 'ratelimiter — 返回登录',
        language: '语言',
        recoverAccess: '恢复访问',
        recoveryHeadline: '安全地恢复控制权。',
        recoveryVisualCopy:
          '无需暴露凭据即可恢复访问。我们会将下一步发送到账户邮箱。',
        securityInfo: '安全信息',
        recoveryPrivate: '受保护的请求',
        recoveryPrivateCopy:
          '无论该邮箱是否存在账户，系统都会返回相同的结果。',
        sealed: '已封存',
        stepVerify: '安全邮箱',
        stepDeliver: '受保护链接',
        stepRestore: '访问已恢复',
        backToLogin: '返回登录',
        recovery: '恢复访问',
        forgotPasswordTitle: '重置密码',
        forgotPasswordIntro: '输入账户邮箱，我们会发送恢复访问的说明。',
        email: '邮箱',
        emailPlaceholder: 'name@company.com',
        privacyNote: '出于安全原因，我们不会透露该邮箱是否关联账户。',
        sending: '正在发送…',
        sendInstructions: '发送说明',
        rememberedPassword: '想起密码了？',
        signIn: '登录',
        requestSent: '请求已发送',
        checkYourEmail: '请检查邮箱。',
        checkYourEmailCopy:
          '如果该邮箱存在账户，你很快会收到重置密码的说明。',
        deliveryHint: '没收到邮件？请检查垃圾邮件文件夹，或稍后重试。',
        useAnotherEmail: '使用其他邮箱',
        emailRequired: '请输入邮箱。',
        invalidEmail: '请输入有效的邮箱地址。',
        invalidField: '请检查此字段。',
        networkError: '无法连接服务器，请检查网络连接后重试。',
        recoveryGenericError: '暂时无法处理该请求，请稍后再试。',
      },
    };

    const value = fallbacks[locale]?.[key] ?? fallbacks['pt']?.[key] ?? fallback;
    return this.interpolate(value, vars);
  }

  private interpolate(
    value: string,
    vars: Record<string, string | number>,
  ): string {
    return Object.entries(vars).reduce(
      (result, [name, replacement]) =>
        result.replaceAll(`{${name}}`, String(replacement)),
      value,
    );
  }

  onLanguageChange(locale: Locale): void {
    this.i18n.setLocale(locale);
  }

  isEmailInvalid(): boolean {
    const control = this.recoveryForm.controls.email;
    return control.invalid && (control.touched || control.dirty);
  }

  getEmailError(): string {
    const control = this.recoveryForm.controls.email;

    if (control.hasError('required')) {
      return this.text('emailRequired', 'Indique o seu email.');
    }

    if (control.hasError('email')) {
      return this.text('invalidEmail', 'Introduza um email válido.');
    }

    return this.text('invalidField', 'Verifique este campo.');
  }

  recover(): void {
    this.errorMessage.set('');

    if (this.recoveryForm.invalid) {
      this.recoveryForm.markAllAsTouched();
      this.emailInput?.nativeElement.focus();
      return;
    }

    if (this.loading() || this.requestSent()) {
      return;
    }

    const email = this.recoveryForm.controls.email.value.trim();
    this.recoveryForm.controls.email.setValue(email, { emitEvent: false });
    this.loading.set(true);

    this.auth
      .requestPasswordReset(email)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.submittedEmail.set(email);
          this.requestSent.set(true);
        },
        error: (err: { status?: number }) => {
          this.loading.set(false);

          // Keep recovery responses generic so the UI does not disclose
          // whether an account exists for the submitted email.
          if (err?.status === 0) {
            this.errorMessage.set(
              this.text(
                'networkError',
                'Não foi possível contactar o servidor. Verifique a sua ligação e tente novamente.',
              ),
            );
            return;
          }

          this.errorMessage.set(
            this.text(
              'recoveryGenericError',
              'Não foi possível processar o pedido neste momento. Tente novamente.',
            ),
          );
        },
      });
  }

  startOver(): void {
    this.requestSent.set(false);
    this.errorMessage.set('');
    this.recoveryForm.reset({ email: '' });

    this.document.defaultView?.setTimeout(() => {
      this.emailInput?.nativeElement.focus();
    }, 0);
  }
}