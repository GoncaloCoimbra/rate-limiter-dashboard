import { CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from './auth.service';
import { Locale, TranslationService } from '../shared/translation.service';

interface RegisterFormValue {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

const SPECIAL_CHARS = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?`~]/;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <section class="auth-visual" aria-labelledby="register-visual-title">
        <a class="brand" routerLink="/login" [attr.aria-label]="text('brandAria', 'ratelimiter — voltar ao login')">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M7 18V9M12 18V5M17 18v-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
            </svg>
          </span>
          <span>ratelimiter</span>
        </a>

        <div class="visual-content">
          <p class="eyebrow">{{ text('startWithClarity', 'COMECE COM CLAREZA') }}</p>
          <h1 id="register-visual-title">{{ text('registerHeadline', 'Uma base segura para a sua API.') }}</h1>
          <p class="visual-copy">
            {{ text('registerVisualCopy', 'Crie o seu workspace e tenha uma visão clara sobre o tráfego desde o primeiro pedido.') }}
          </p>

          <div class="product-preview" [attr.aria-label]="text('productPreview', 'Pré-visualização do produto')">
            <div class="preview-top">
              <span class="preview-title">{{ text('trafficOverview', 'Visão geral do tráfego') }}</span>
              <span class="preview-live"><span></span> {{ text('live', 'Ativo') }}</span>
            </div>

            <div class="preview-chart" aria-hidden="true">
              <span></span><span></span><span></span><span></span><span></span><span></span>
              <span></span><span></span><span></span><span></span><span></span><span></span>
            </div>

            <div class="workspace-sequence" aria-hidden="true">
              <span class="sequence-step active"><b>01</b> {{ text('sequenceIdentity', 'Identity') }}</span>
              <span class="sequence-line"></span>
              <span class="sequence-step"><b>02</b> {{ text('sequenceProtect', 'Protect') }}</span>
              <span class="sequence-line"></span>
              <span class="sequence-step"><b>03</b> {{ text('sequenceMonitor', 'Monitor') }}</span>
            </div>

            <div class="preview-stats">
              <div>
                <small>{{ text('requests', 'Pedidos') }}</small>
                <strong>24.8k</strong>
              </div>
              <div>
                <small>{{ text('blocked', 'Bloqueados') }}</small>
                <strong>1.7%</strong>
              </div>
              <div>
                <small>{{ text('latency', 'Latência') }}</small>
                <strong>82ms</strong>
              </div>
            </div>

            <div class="security-horizon" aria-hidden="true">
              <span class="horizon-ring ring-one"></span>
              <span class="horizon-ring ring-two"></span>
              <span class="horizon-core"><i></i></span>
              <span class="horizon-label">WORKSPACE<br><b>READY TO PROTECT</b></span>
            </div>
          </div>
        </div>

        <small class="visual-footer">© 2026 ratelimiter</small>
      </section>

      <section class="auth-panel">
        <header class="auth-top">
          <div class="account-hint-wrap">
            <span class="account-hint">{{ text('alreadyAccount', 'Já tem conta?') }}</span>
            <a routerLink="/login" class="top-link">{{ text('signIn', 'Entrar') }}</a>
          </div>
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
          <div class="auth-heading">
            <p class="eyebrow">{{ text('newWorkspace', 'NOVO WORKSPACE') }}</p>
            <h2>{{ text('createAccount', 'Criar conta') }}</h2>
            <p class="intro">
              {{ text('setupDescription', 'Crie as suas credenciais para começar a proteger o tráfego da sua API.') }}
            </p>
          </div>

          <form
            class="auth-form"
            [formGroup]="registerForm"
            (ngSubmit)="onRegister()"
            novalidate
          >
            <fieldset [disabled]="isSubmitting()" class="form-fieldset">
              <div class="identity-grid">
                <div class="field-group">
                  <label for="name" class="field-label">
                    {{ text('fullName', 'Nome completo') }}
                    <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="name"
                    class="form-input"
                    type="text"
                    formControlName="name"
                    autocomplete="name"
                    [placeholder]="text('namePlaceholder', 'João Silva')"
                    [class.invalid]="isFieldInvalid('name')"
                    [attr.aria-invalid]="isFieldInvalid('name')"
                    [attr.aria-describedby]="isFieldInvalid('name') ? 'name-error' : null"
                  />
                  @if (isFieldInvalid('name')) {
                    <p id="name-error" class="field-error">{{ getFieldError('name') }}</p>
                  }
                </div>

                <div class="field-group">
                  <label for="email" class="field-label">
                    {{ text('email', 'Email') }}
                    <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="email"
                    class="form-input"
                    type="email"
                    formControlName="email"
                    autocomplete="email"
                    inputmode="email"
                    autocapitalize="none"
                    spellcheck="false"
                    [placeholder]="text('emailPlaceholder', 'nome@empresa.pt')"
                    [class.invalid]="isFieldInvalid('email')"
                    [attr.aria-invalid]="isFieldInvalid('email')"
                    [attr.aria-describedby]="isFieldInvalid('email') ? 'email-error' : null"
                  />
                  @if (isFieldInvalid('email')) {
                    <p id="email-error" class="field-error">{{ getFieldError('email') }}</p>
                  }
                </div>
              </div>

              <div class="field-group">
                <div class="label-row">
                  <label for="password" class="field-label">
                    {{ text('password', 'Password') }}
                    <span aria-hidden="true">*</span>
                  </label>
                  @if (registerForm.controls['password'].value) {
                    <span class="strength-mini" [style.color]="passwordStrength().color">
                      {{ passwordStrength().label }}
                    </span>
                  }
                </div>

                <div class="password-wrap">
                  <input
                    id="password"
                    class="form-input"
                    [type]="showPassword() ? 'text' : 'password'"
                    formControlName="password"
                    autocomplete="new-password"
                    [placeholder]="text('passwordPlaceholder', 'Crie uma password forte')"
                    [class.invalid]="isFieldInvalid('password')"
                    [attr.aria-invalid]="isFieldInvalid('password')"
                    aria-describedby="password-guidance"
                  />
                  <button
                    type="button"
                    class="password-toggle"
                    (click)="togglePasswordVisibility()"
                    [attr.aria-label]="showPassword()
                      ? text('hidePassword', 'Ocultar password')
                      : text('showPassword', 'Mostrar password')"
                    [attr.aria-pressed]="showPassword()"
                  >
                    @if (showPassword()) {
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M3 3 21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                        <path d="M10.6 10.7a2.5 2.5 0 0 0 3.5 3.5M9.9 5.2A10.4 10.4 0 0 1 12 5c5.2 0 8.5 4.5 9.3 6-.4.8-1.7 2.7-3.8 4.5M6.5 7.1C4.4 8.7 3.2 10.6 2.7 12c.8 1.5 4.1 6 9.3 6 1 0 1.9-.1 2.7-.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    } @else {
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M2.7 12c.8-1.5 4.1-6 9.3-6s8.5 4.5 9.3 6c-.8 1.5-4.1 6-9.3 6s-8.5-4.5-9.3-6Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
                        <circle cx="12" cy="12" r="2.7" stroke="currentColor" stroke-width="1.7"/>
                      </svg>
                    }
                  </button>
                </div>

                @if (registerForm.controls['password'].value) {
                  <div id="password-guidance" class="password-guidance" aria-live="polite">
                    <div class="strength-track" aria-hidden="true">
                      <span
                        [style.width.%]="passwordStrength().score * 20"
                        [style.background]="passwordStrength().color"
                      ></span>
                    </div>
                    <div class="requirements-grid">
                      <span [class.met]="passwordStrength().requirements.minLength">
                        <i aria-hidden="true">{{ passwordStrength().requirements.minLength ? '✓' : '○' }}</i>
                        {{ text('minLength', '8+ caracteres') }}
                      </span>
                      <span [class.met]="passwordStrength().requirements.hasUppercase">
                        <i aria-hidden="true">{{ passwordStrength().requirements.hasUppercase ? '✓' : '○' }}</i>
                        {{ text('hasUppercase', 'Uma maiúscula') }}
                      </span>
                      <span [class.met]="passwordStrength().requirements.hasLowercase">
                        <i aria-hidden="true">{{ passwordStrength().requirements.hasLowercase ? '✓' : '○' }}</i>
                        {{ text('hasLowercase', 'Uma minúscula') }}
                      </span>
                      <span [class.met]="passwordStrength().requirements.hasNumber">
                        <i aria-hidden="true">{{ passwordStrength().requirements.hasNumber ? '✓' : '○' }}</i>
                        {{ text('hasNumber', 'Um número') }}
                      </span>
                      <span [class.met]="passwordStrength().requirements.hasSpecial">
                        <i aria-hidden="true">{{ passwordStrength().requirements.hasSpecial ? '✓' : '○' }}</i>
                        {{ text('hasSpecial', 'Um símbolo') }}
                      </span>
                    </div>
                  </div>
                }

                @if (isFieldInvalid('password')) {
                  <p class="field-error">{{ getFieldError('password') }}</p>
                }
              </div>

              <div class="field-group">
                <label for="confirm-password" class="field-label">
                  {{ text('confirmPassword', 'Confirmar password') }}
                  <span aria-hidden="true">*</span>
                </label>

                <div class="password-wrap">
                  <input
                    id="confirm-password"
                    class="form-input"
                    [type]="showPassword() ? 'text' : 'password'"
                    formControlName="confirmPassword"
                    autocomplete="new-password"
                    [placeholder]="text('confirmPasswordPlaceholder', 'Repita a password')"
                    [class.invalid]="isConfirmPasswordInvalid()"
                    [class.valid]="isPasswordMatch()"
                    [attr.aria-invalid]="isConfirmPasswordInvalid()"
                    [attr.aria-describedby]="isConfirmPasswordInvalid() ? 'confirm-error' : null"
                  />
                </div>

                @if (isPasswordMatch()) {
                  <p class="field-success">
                    <span aria-hidden="true">✓</span>
                    {{ text('passwordsMatch', 'As passwords coincidem.') }}
                  </p>
                } @else if (isConfirmPasswordInvalid()) {
                  <p id="confirm-error" class="field-error">
                    {{ text('passwordsMismatch', 'As passwords não coincidem.') }}
                  </p>
                }
              </div>

              <div class="terms-row">
                <input
                  id="agree-terms"
                  type="checkbox"
                  formControlName="agreeToTerms"
                  class="form-checkbox"
                  [attr.aria-invalid]="isFieldInvalid('agreeToTerms')"
                  [attr.aria-describedby]="isFieldInvalid('agreeToTerms') ? 'terms-error' : null"
                />
                <label for="agree-terms" class="terms-label">
                  <span>
                    {{ text('agreeToTerms', 'Concordo com os') }}
                    <a routerLink="/termos" target="_blank" rel="noopener" class="terms-link">
                      {{ text('termsAndConditions', 'Termos e Condições') }}
                    </a>
                    <span aria-hidden="true">*</span>
                  </span>
                </label>
              </div>

              @if (isFieldInvalid('agreeToTerms')) {
                <p id="terms-error" class="field-error terms-error">
                  {{ text('mustAgreeToTerms', 'É necessário aceitar os termos para continuar.') }}
                </p>
              }

              @if (successMessage()) {
                <div class="message success-message" role="status" aria-live="polite">
                  <div class="message-icon" aria-hidden="true">
                    <svg viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/>
                      <path d="m6.8 10 2.1 2.1 4.4-4.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <p>{{ successMessage() }}</p>
                </div>
              }

              @if (errorMessage()) {
                <div class="message error-message" role="alert" aria-live="assertive">
                  <div class="message-icon" aria-hidden="true">
                    <svg viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/>
                      <path d="M10 6.5v4.2M10 13.6h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
                    </svg>
                  </div>
                  <div class="message-body">
                    <p>{{ errorMessage() }}</p>
                    <button
                      type="button"
                      class="message-close"
                      (click)="clearMessages()"
                      [attr.aria-label]="text('close', 'Fechar')"
                    >×</button>
                  </div>
                </div>
              }

              <button
                class="submit-button"
                type="submit"
                [disabled]="isSubmitting()"
                [attr.aria-busy]="isSubmitting()"
              >
                @if (isSubmitting()) {
                  <span class="button-spinner" aria-hidden="true"></span>
                  <span class="button-label">{{ text('creatingAccount', 'A criar conta…') }}</span>
                } @else {
                  <span class="button-label">{{ text('createAccount', 'Criar conta') }}</span>
                  <svg class="button-arrow" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M4.5 10h10M10.5 5.5 15 10l-4.5 4.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                }
              </button>
            </fieldset>
          </form>

          <p class="legal-note">
            {{ text('legalNote', 'Ao criar uma conta, concorda com os termos aplicáveis ao serviço.') }}
          </p>
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
      grid-template-columns: minmax(420px, .95fr) minmax(520px, 1.05fr);
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
        radial-gradient(circle at 82% 16%, rgba(63, 201, 214, .16), transparent 28%),
        radial-gradient(circle at 14% 84%, rgba(10, 130, 166, .18), transparent 34%),
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
      mask-image: linear-gradient(to bottom, black, transparent 82%);
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

    .visual-content {
      width: min(520px, 100%);
      margin: auto 0;
      padding-block: 54px;
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
      max-width: 530px;
      margin: 0;
      font-size: clamp(40px, 4.7vw, 68px);
      line-height: 1.01;
      letter-spacing: -.055em;
      font-weight: 580;
    }

    .visual-copy {
      max-width: 470px;
      margin: 20px 0 0;
      color: #b9dce7;
      font-size: 15px;
      line-height: 1.65;
    }

    .product-preview {
      position: relative;
      overflow: hidden;
      isolation: isolate;
      width: min(470px, 100%);
      margin-top: 34px;
      padding: 16px;
      border: 1px solid rgba(151, 234, 241, .13);
      border-radius: 18px;
      background: rgba(6, 27, 42, .30);
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.05),
        0 24px 60px rgba(1, 19, 31, .16);
      backdrop-filter: blur(9px);
    }

    .product-preview::after {
      content: "";
      position: absolute;
      inset: auto -15% -55% 30%;
      height: 180px;
      background: radial-gradient(ellipse, rgba(98,220,229,.10), transparent 68%);
      pointer-events: none;
    }

    .preview-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .preview-title {
      color: #dff7fb;
      font-size: 11px;
      font-weight: 700;
    }

    .preview-live {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #98d7de;
      font-size: 10px;
    }

    .preview-live span {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #62dce5;
      box-shadow: 0 0 0 4px rgba(98,220,229,.10);
      animation: live-pulse 2s ease-in-out infinite;
    }

    .preview-chart {
      position: relative;
      height: 82px;
      display: flex;
      align-items: end;
      gap: 5px;
      margin-top: 18px;
      padding: 0 3px;
      overflow: hidden;
    }

    .preview-chart::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(130,241,244,.10) 48%,
        transparent 52%
      );
      transform: translateX(-110%);
      animation: workspace-scan 5.2s linear infinite;
      pointer-events: none;
    }

    .preview-chart span {
      flex: 1;
      border-radius: 999px 999px 2px 2px;
      background: linear-gradient(to top, rgba(98,220,229,.18), rgba(98,220,229,.80));
      transform-origin: bottom;
      animation: bar-rise 1.2s cubic-bezier(.2,.7,.2,1) backwards;
    }

    .preview-chart span:nth-child(1) { height: 34%; animation-delay: .02s; }
    .preview-chart span:nth-child(2) { height: 47%; animation-delay: .06s; }
    .preview-chart span:nth-child(3) { height: 39%; animation-delay: .10s; }
    .preview-chart span:nth-child(4) { height: 61%; animation-delay: .14s; }
    .preview-chart span:nth-child(5) { height: 52%; animation-delay: .18s; }
    .preview-chart span:nth-child(6) { height: 70%; animation-delay: .22s; }
    .preview-chart span:nth-child(7) { height: 63%; animation-delay: .26s; }
    .preview-chart span:nth-child(8) { height: 84%; animation-delay: .30s; }
    .preview-chart span:nth-child(9) { height: 75%; animation-delay: .34s; }
    .preview-chart span:nth-child(10) { height: 91%; animation-delay: .38s; }
    .preview-chart span:nth-child(11) { height: 81%; animation-delay: .42s; }
    .preview-chart span:nth-child(12) { height: 96%; animation-delay: .46s; }

    .workspace-sequence {
      position: relative;
      z-index: 2;
      display: grid;
      grid-template-columns: auto 1fr auto 1fr auto;
      align-items: center;
      gap: 7px;
      margin-top: 12px;
      padding: 8px 9px;
      border: 1px solid rgba(122,232,235,.10);
      border-radius: 8px;
      background: rgba(2,25,39,.22);
    }

    .sequence-step {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: rgba(190,232,237,.48);
      font-size: 7px;
      font-weight: 800;
      letter-spacing: .07em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .sequence-step b {
      color: rgba(190,232,237,.32);
      font-size: 7px;
    }

    .sequence-step.active { color: #a9f1f1; }
    .sequence-step.active b { color: #71e5e9; }

    .sequence-line {
      height: 1px;
      background: linear-gradient(90deg, rgba(114,232,236,.18), rgba(114,232,236,.05));
    }

    .preview-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-top: 14px;
    }

    .preview-stats div {
      min-width: 0;
      padding: 9px 10px;
      border: 1px solid rgba(255,255,255,.06);
      border-radius: 11px;
      background: rgba(255,255,255,.03);
    }

    .preview-stats small,
    .preview-stats strong { display: block; }

    .preview-stats small {
      color: #8db9c5;
      font-size: 9px;
    }

    .preview-stats strong {
      margin-top: 3px;
      color: #ebfcff;
      font-size: 12px;
      font-weight: 700;
    }

    .security-horizon {
      position: absolute;
      right: -30px;
      bottom: -62px;
      width: 190px;
      height: 190px;
      pointer-events: none;
    }

    .horizon-ring,
    .horizon-core {
      position: absolute;
      inset: 50%;
      border-radius: 50%;
      transform: translate(-50%, -50%);
    }

    .horizon-ring {
      border: 1px solid rgba(110,232,236,.12);
      animation: horizon-rotate 14s linear infinite;
    }

    .ring-one { width: 105px; height: 105px; }
    .ring-two {
      width: 145px;
      height: 145px;
      border-style: dashed;
      animation-direction: reverse;
      animation-duration: 19s;
    }

    .horizon-core {
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      background: rgba(69,203,212,.08);
      border: 1px solid rgba(116,231,235,.24);
      box-shadow: 0 0 28px rgba(80,218,225,.10);
    }

    .horizon-core i {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #75e8eb;
      box-shadow:
        0 0 0 7px rgba(117,232,235,.07),
        0 0 22px rgba(117,232,235,.24);
      animation: horizon-pulse 2.2s ease-in-out infinite;
    }

    .horizon-label {
      position: absolute;
      left: 5px;
      top: 66px;
      color: rgba(173,226,232,.42);
      font-size: 7px;
      line-height: 1.5;
      letter-spacing: .12em;
      text-transform: uppercase;
    }

    .horizon-label b { color: rgba(210,248,249,.68); }

    .visual-footer {
      color: #83aebc;
      font-size: 11px;
    }

    .auth-panel {
      min-height: 100dvh;
      display: grid;
      grid-template-rows: auto 1fr;
      padding: clamp(22px, 3vw, 42px) clamp(24px, 4.8vw, 78px);
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
      gap: 9px;
    }

    .account-hint-wrap {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 3px 4px 3px 12px;
      border: 1px solid #d7e1e8;
      border-radius: 10px;
      background: rgba(255,255,255,0.72);
    }

    .account-hint {
      color: #748593;
      font-size: 10px;
      font-weight: 600;
    }

    .top-link {
      padding: 5px 10px;
      border-radius: 7px;
      color: #0d546f;
      background: #e7f5f8;
      font-size: 10px;
      font-weight: 800;
      text-decoration: none;
      transition: background .15s ease;
    }

    .top-link:hover { background: #d4eef4; }

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

    .password-toggle:focus-visible,
    .message-close:focus-visible,
    .form-checkbox:focus-visible,
    .top-link:focus-visible,
    .language-option:focus-visible,
    .submit-button:focus-visible,
    .terms-link:focus-visible {
      outline: 3px solid rgba(16,160,185,.18);
      outline-offset: 2px;
      border-radius: 6px;
    }

    .auth-content {
      width: min(520px, 100%);
      margin: auto;
      padding-block: 38px 24px;
    }

    .auth-heading h2 {
      margin: 0;
      color: #102a43;
      font-size: clamp(34px, 4vw, 48px);
      line-height: 1.04;
      letter-spacing: -.05em;
      font-weight: 600;
    }

    .intro {
      max-width: 490px;
      margin: 13px 0 0;
      color: #63798b;
      font-size: 14px;
      line-height: 1.62;
    }

    .auth-form { margin-top: 31px; }

    .form-fieldset {
      min-inline-size: 0;
      margin: 0;
      padding: 0;
      border: 0;
    }

    .identity-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .field-group {
      display: grid;
      gap: 8px;
      margin-bottom: 18px;
    }

    .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .field-label {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #263f55;
      font-size: 12px;
      font-weight: 700;
    }

    .field-label > span { color: #d25b6f; }

    .strength-mini {
      font-size: 11px;
      font-weight: 750;
      transition: color .2s ease;
    }

    .form-input {
      width: 100%;
      min-height: 50px;
      padding: 0 14px;
      border: 1px solid #d5e0e8;
      border-radius: 12px;
      outline: none;
      background: #ffffff;
      color: #102a43;
      font: inherit;
      font-size: 14px;
      transition: border-color .16s ease, box-shadow .16s ease, background-color .16s ease;
    }

    .form-input::placeholder { color: #aab8c4; }
    .form-input:hover { border-color: #bccedb; }

    .form-input:focus {
      border-color: #10a0b9;
      box-shadow: 0 0 0 4px rgba(16,160,185,.10);
    }

    .form-input.invalid {
      border-color: #d95e72;
      box-shadow: 0 0 0 4px rgba(217,94,114,.07);
    }

    .form-input.valid {
      border-color: #24a58f;
      box-shadow: 0 0 0 4px rgba(36,165,143,.06);
    }

    .password-wrap { position: relative; }

    .password-wrap .form-input { padding-right: 48px; }

    .password-toggle {
      position: absolute;
      top: 50%;
      right: 9px;
      width: 38px;
      height: 38px;
      display: grid;
      place-items: center;
      padding: 0;
      border: 0;
      border-radius: 9px;
      background: transparent;
      color: #8a9dab;
      cursor: pointer;
      transform: translateY(-50%);
      transition: background .15s ease, color .15s ease;
    }

    .password-toggle:hover {
      color: #0b7895;
      background: #f1f7fa;
    }

    .password-toggle svg { width: 19px; height: 19px; }

    .password-guidance {
      display: grid;
      gap: 9px;
      margin-top: 2px;
    }

    .strength-track {
      height: 4px;
      overflow: hidden;
      border-radius: 999px;
      background: #e5edf1;
    }

    .strength-track span {
      display: block;
      height: 100%;
      border-radius: inherit;
      transition: width .25s ease, background .25s ease;
    }

    .requirements-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px 14px;
      color: #94a4b0;
      font-size: 10.5px;
    }

    .requirements-grid span {
      display: flex;
      align-items: center;
      gap: 6px;
      transition: color .2s ease;
    }

    .requirements-grid i {
      width: 14px;
      display: inline-flex;
      justify-content: center;
      font-style: normal;
      color: #aeb9c1;
      transition: color .2s ease, transform .2s ease;
    }

    .requirements-grid span.met { color: #438b82; }

    .requirements-grid span.met i {
      color: #0b897e;
      font-weight: 800;
      transform: scale(1.08);
    }

    .field-error,
    .field-success {
      margin: -2px 0 0;
      font-size: 11.5px;
      line-height: 1.45;
    }

    .field-error { color: #b6465d; }

    .field-success {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #087f78;
      font-weight: 600;
    }

    .field-success span { font-size: 14px; }

    .terms-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-top: 2px;
    }

    .form-checkbox {
      flex: 0 0 18px;
      width: 18px;
      height: 18px;
      margin: 1px 0 0;
      accent-color: #0b7895;
      cursor: pointer;
    }

    .terms-label {
      color: #63798b;
      font-size: 11.5px;
      line-height: 1.55;
      cursor: pointer;
    }

    .terms-label > span > span { color: #d25b6f; }

    .terms-link {
      color: #0a7895;
      font-weight: 700;
      text-decoration: none;
    }

    .terms-link:hover {
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    .terms-error {
      margin-left: 28px;
      margin-top: -13px;
    }

    .message {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-top: 17px;
      padding: 12px 13px;
      border-radius: 12px;
      font-size: 12px;
      line-height: 1.5;
      animation: slide-down 180ms ease-out;
    }

    .success-message {
      border: 1px solid #bfe9df;
      background: #edf9f6;
      color: #087f78;
    }

    .error-message {
      border: 1px solid #f1c1ca;
      background: #fff2f4;
      color: #a63f53;
    }

    .message-icon {
      flex: 0 0 20px;
      width: 20px;
      height: 20px;
    }

    .message-body {
      min-width: 0;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      width: 100%;
    }

    .message-body p,
    .message > p { margin: 1px 0 0; }

    .message-close {
      flex: 0 0 auto;
      margin-left: auto;
      padding: 0 2px;
      border: 0;
      background: transparent;
      color: currentColor;
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
      opacity: .65;
      transition: opacity .15s ease;
    }

    .message-close:hover { opacity: 1; }

    /* ─────────────────────────────────────────────────────────────
       SUBMIT BUTTON — CORREÇÃO
       O SVG dentro do botão precisa de dimensões explícitas para
       não esticar em contexto flex. Aplicamos flex-shrink: 0 e
       width/height fixos, e impedimos o texto de quebrar linha.
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

    .legal-note {
      margin: 15px 0 0;
      color: #93a3af;
      font-size: 10.5px;
      line-height: 1.55;
      text-align: center;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slide-down {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes live-pulse {
      0%, 100% { opacity: .55; transform: scale(.9); }
      50% { opacity: 1; transform: scale(1.15); }
    }
    @keyframes workspace-scan {
      to { transform: translateX(110%); }
    }
    @keyframes bar-rise {
      from { transform: scaleY(.1); opacity: .3; }
      to { transform: scaleY(1); opacity: 1; }
    }
    @keyframes horizon-rotate {
      to { transform: translate(-50%, -50%) rotate(360deg); }
    }
    @keyframes horizon-pulse {
      0%, 100% { transform: scale(.85); opacity: .62; }
      50% { transform: scale(1.15); opacity: 1; }
    }

    @media (max-width: 1000px) {
      .auth-page { grid-template-columns: 1fr; }
      .auth-visual { min-height: auto; padding: 26px 24px 32px; }
      .visual-content { margin: 52px 0 28px; padding: 0; }
      .product-preview { max-width: 640px; }
      .auth-panel { min-height: auto; padding: 22px 24px 42px; }
      .auth-content { padding-top: 34px; }
    }

    @media (max-width: 620px) {
      .account-hint { display: none; }
      .auth-panel { padding-inline: 18px; }
      .identity-grid,
      .requirements-grid { grid-template-columns: 1fr; }
      .auth-heading h2 { font-size: 35px; }
    }

    @media (max-width: 460px) {
      .preview-stats { grid-template-columns: 1fr; }
      .preview-stats div {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .preview-stats strong { margin-top: 0; }

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
export class RegisterComponent implements OnInit, OnDestroy {
  readonly i18n = inject(TranslationService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly document = inject(DOCUMENT);
  private readonly destroy$ = new Subject<void>();

  registerForm!: FormGroup;
  readonly showPassword = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly submitted = signal(false);
  readonly passwordStrength = computed<PasswordStrength>(() =>
    this.calculatePasswordStrength(),
  );

  private redirectTimer?: ReturnType<typeof setTimeout>;

  readonly availableLocales: Array<{ value: Locale; label: string }> = [
    { value: 'pt', label: 'PT' },
    { value: 'en', label: 'EN' },
    { value: 'zh', label: '中文' },
  ];

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
    }
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group(
      {
        name: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(100),
          ],
        ],
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            this.passwordValidator,
          ],
        ],
        confirmPassword: ['', Validators.required],
        agreeToTerms: [false, Validators.requiredTrue],
      },
      { validators: this.passwordMatchValidator },
    );
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
        startWithClarity: 'COMECE COM CLAREZA',
        registerHeadline: 'Uma base segura para a sua API.',
        registerVisualCopy:
          'Crie o seu workspace e tenha uma visão clara sobre o tráfego desde o primeiro pedido.',
        productPreview: 'Pré-visualização do produto',
        trafficOverview: 'Visão geral do tráfego',
        live: 'Ativo',
        sequenceIdentity: 'Identity',
        sequenceProtect: 'Protect',
        sequenceMonitor: 'Monitor',
        requests: 'Pedidos',
        blocked: 'Bloqueados',
        latency: 'Latência',
        alreadyAccount: 'Já tem conta?',
        language: 'Idioma',
        newWorkspace: 'NOVO WORKSPACE',
        createAccount: 'Criar conta',
        setupDescription:
          'Crie as suas credenciais para começar a proteger o tráfego da sua API.',
        fullName: 'Nome completo',
        namePlaceholder: 'João Silva',
        email: 'Email',
        emailPlaceholder: 'nome@empresa.pt',
        password: 'Password',
        passwordPlaceholder: 'Crie uma password forte',
        confirmPassword: 'Confirmar password',
        confirmPasswordPlaceholder: 'Repita a password',
        showPassword: 'Mostrar password',
        hidePassword: 'Ocultar password',
        minLength: '8+ caracteres',
        hasUppercase: 'Uma maiúscula',
        hasLowercase: 'Uma minúscula',
        hasNumber: 'Um número',
        hasSpecial: 'Um símbolo',
        passwordsMatch: 'As passwords coincidem.',
        passwordsMismatch: 'As passwords não coincidem.',
        agreeToTerms: 'Concordo com os',
        termsAndConditions: 'Termos e Condições',
        mustAgreeToTerms: 'É necessário aceitar os termos para continuar.',
        creatingAccount: 'A criar conta…',
        legalNote:
          'Ao criar uma conta, concorda com os termos aplicáveis ao serviço.',
        signIn: 'Entrar',
        close: 'Fechar',
        accountCreatedRedirect: 'Conta criada com sucesso. A abrir o login…',
        emailAlreadyRegistered:
          'Este email já está registado. Faça login ou recupere a password.',
        registrationInvalid:
          'Alguns dados não foram aceites. Verifique o formulário.',
        networkError:
          'Não foi possível contactar o servidor. Verifique a sua ligação e tente novamente.',
        registrationGenericError:
          'Não foi possível criar a conta neste momento. Tente novamente.',
        requiredField: '{field} é obrigatório.',
        minimumCharacters: 'Deve ter pelo menos {n} caracteres.',
        maximumCharacters: 'Não pode ter mais de {n} caracteres.',
        invalidEmail: 'Introduza um email válido.',
        weakPassword:
          'A password ainda não cumpre todos os requisitos apresentados abaixo.',
        invalidField: 'Verifique este campo.',
      },
      en: {
        brandAria: 'ratelimiter — back to sign in',
        startWithClarity: 'START WITH CLARITY',
        registerHeadline: 'A secure foundation for your API.',
        registerVisualCopy:
          'Create your workspace and get a clear view of traffic from the very first request.',
        productPreview: 'Product preview',
        trafficOverview: 'Traffic overview',
        live: 'Live',
        sequenceIdentity: 'Identity',
        sequenceProtect: 'Protect',
        sequenceMonitor: 'Monitor',
        requests: 'Requests',
        blocked: 'Blocked',
        latency: 'Latency',
        alreadyAccount: 'Already have an account?',
        language: 'Language',
        newWorkspace: 'NEW WORKSPACE',
        createAccount: 'Create account',
        setupDescription:
          'Create your credentials to start protecting your API traffic.',
        fullName: 'Full name',
        namePlaceholder: 'John Doe',
        email: 'Email',
        emailPlaceholder: 'name@company.com',
        password: 'Password',
        passwordPlaceholder: 'Create a strong password',
        confirmPassword: 'Confirm password',
        confirmPasswordPlaceholder: 'Repeat password',
        showPassword: 'Show password',
        hidePassword: 'Hide password',
        minLength: '8+ characters',
        hasUppercase: 'One uppercase letter',
        hasLowercase: 'One lowercase letter',
        hasNumber: 'One number',
        hasSpecial: 'One symbol',
        passwordsMatch: 'Passwords match.',
        passwordsMismatch: 'Passwords do not match.',
        agreeToTerms: 'I agree to the',
        termsAndConditions: 'Terms and Conditions',
        mustAgreeToTerms: 'You must accept the terms to continue.',
        creatingAccount: 'Creating account…',
        legalNote:
          'By creating an account, you agree to the terms that apply to the service.',
        signIn: 'Sign in',
        close: 'Close',
        accountCreatedRedirect:
          'Account created successfully. Opening sign in…',
        emailAlreadyRegistered:
          'This email is already registered. Sign in or reset your password.',
        registrationInvalid: 'Some details were not accepted. Check the form.',
        networkError:
          'The server could not be reached. Check your connection and try again.',
        registrationGenericError:
          'We could not create your account right now. Please try again.',
        requiredField: '{field} is required.',
        minimumCharacters: 'Must be at least {n} characters.',
        maximumCharacters: 'Cannot be longer than {n} characters.',
        invalidEmail: 'Enter a valid email address.',
        weakPassword:
          'The password does not meet all the requirements shown below.',
        invalidField: 'Check this field.',
      },
      zh: {
        brandAria: 'ratelimiter — 返回登录',
        startWithClarity: '从清晰开始',
        registerHeadline: '为你的 API 打下安全基础。',
        registerVisualCopy: '创建工作区，从第一个请求开始清晰了解流量。',
        productPreview: '产品预览',
        trafficOverview: '流量概览',
        live: '实时',
        sequenceIdentity: '身份',
        sequenceProtect: '防护',
        sequenceMonitor: '监控',
        requests: '请求数',
        blocked: '已拦截',
        latency: '延迟',
        alreadyAccount: '已经有账户？',
        language: '语言',
        newWorkspace: '新工作区',
        createAccount: '创建账户',
        setupDescription: '创建凭据，开始保护你的 API 流量。',
        fullName: '姓名',
        namePlaceholder: '张三',
        email: '邮箱',
        emailPlaceholder: 'name@company.com',
        password: '密码',
        passwordPlaceholder: '创建强密码',
        confirmPassword: '确认密码',
        confirmPasswordPlaceholder: '重复密码',
        showPassword: '显示密码',
        hidePassword: '隐藏密码',
        minLength: '至少 8 个字符',
        hasUppercase: '一个大写字母',
        hasLowercase: '一个小写字母',
        hasNumber: '一个数字',
        hasSpecial: '一个符号',
        passwordsMatch: '密码一致。',
        passwordsMismatch: '密码不一致。',
        agreeToTerms: '我同意',
        termsAndConditions: '条款与条件',
        mustAgreeToTerms: '必须接受条款才能继续。',
        creatingAccount: '正在创建账户…',
        legalNote: '创建账户即表示你同意适用于本服务的条款。',
        signIn: '登录',
        close: '关闭',
        accountCreatedRedirect: '账户创建成功。正在打开登录页面…',
        emailAlreadyRegistered: '该邮箱已注册。请登录或重置密码。',
        registrationInvalid: '部分信息未被接受，请检查表单。',
        networkError: '无法连接服务器，请检查网络连接后重试。',
        registrationGenericError: '暂时无法创建账户，请稍后再试。',
        requiredField: '{field}为必填项。',
        minimumCharacters: '至少需要 {n} 个字符。',
        maximumCharacters: '不能超过 {n} 个字符。',
        invalidEmail: '请输入有效的邮箱地址。',
        weakPassword: '密码尚未满足下方列出的所有要求。',
        invalidField: '请检查此字段。',
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

  private passwordValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const password = String(control.value);
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = SPECIAL_CHARS.test(password);

    return hasUppercase && hasLowercase && hasNumber && hasSpecial
      ? null
      : { weakPassword: true };
  }

  private passwordMatchValidator(
    group: AbstractControl,
  ): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  private calculatePasswordStrength(): PasswordStrength {
    const password = String(
      this.registerForm?.get('password')?.value ?? '',
    );

    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: SPECIAL_CHARS.test(password),
    };

    const score = Object.values(requirements).filter(Boolean).length;
    const labels = [
      'Muito fraca',
      'Fraca',
      'Razoável',
      'Boa',
      'Forte',
      'Muito forte',
    ];
    const colors = [
      '#d85c70',
      '#d97b45',
      '#c69c28',
      '#579b77',
      '#278f83',
      '#087f78',
    ];
    const index = Math.min(score, 5);

    return {
      score,
      label: labels[index],
      color: colors[index],
      requirements,
    };
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm?.get(fieldName);
    return (
      !!field &&
      field.invalid &&
      (field.dirty || field.touched || this.submitted())
    );
  }

  isConfirmPasswordInvalid(): boolean {
    const control = this.registerForm?.get('confirmPassword');
    const mismatch = this.registerForm?.hasError('passwordMismatch') ?? false;
    return (
      !!control &&
      (control.invalid || mismatch) &&
      (control.dirty || control.touched || this.submitted())
    );
  }

  isPasswordMatch(): boolean {
    const password = String(this.registerForm?.get('password')?.value ?? '');
    const confirmPassword = String(
      this.registerForm?.get('confirmPassword')?.value ?? '',
    );
    return (
      !!password && !!confirmPassword && password === confirmPassword
    );
  }

  getFieldError(fieldName: string): string {
    const control = this.registerForm.get(fieldName);
    if (!control?.errors) {
      return '';
    }

    if (fieldName === 'agreeToTerms' && control.errors['required']) {
      return this.text(
        'mustAgreeToTerms',
        'É necessário aceitar os termos para continuar.',
      );
    }

    if (control.errors['required']) {
      const labels: Record<string, string> = {
        name: this.text('fullName', 'Nome completo'),
        email: this.text('email', 'Email'),
        password: this.text('password', 'Password'),
        confirmPassword: this.text('confirmPassword', 'Confirmar password'),
      };
      return this.text(
        'requiredField',
        `${labels[fieldName] ?? 'Este campo'} é obrigatório.`,
        { field: labels[fieldName] ?? 'Este campo' },
      );
    }

    if (control.errors['minlength']) {
      return this.text(
        'minimumCharacters',
        `Deve ter pelo menos ${control.errors['minlength'].requiredLength} caracteres.`,
        { n: control.errors['minlength'].requiredLength },
      );
    }

    if (control.errors['maxlength']) {
      return this.text(
        'maximumCharacters',
        `Não pode ter mais de ${control.errors['maxlength'].requiredLength} caracteres.`,
        { n: control.errors['maxlength'].requiredLength },
      );
    }

    if (control.errors['email']) {
      return this.text('invalidEmail', 'Introduza um email válido.');
    }

    if (control.errors['weakPassword']) {
      return this.text(
        'weakPassword',
        'A password ainda não cumpre todos os requisitos apresentados abaixo.',
      );
    }

    if (control.errors['requiredTrue']) {
      return this.text(
        'mustAgreeToTerms',
        'É necessário aceitar os termos para continuar.',
      );
    }

    return this.text('invalidField', 'Verifique este campo.');
  }

  clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  onRegister(): void {
    this.submitted.set(true);
    this.clearMessages();

    if (this.isSubmitting()) {
      return;
    }

    if (this.registerForm.invalid || !this.isPasswordMatch()) {
      this.registerForm.markAllAsTouched();
      this.focusFirstInvalidField();
      return;
    }

    this.isSubmitting.set(true);

    const { name, email, password } =
      this.registerForm.getRawValue() as RegisterFormValue;

    this.auth
      .register(name.trim(), email.trim(), password)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.successMessage.set(
            this.text(
              'accountCreatedRedirect',
              'Conta criada com sucesso. A abrir o login…',
            ),
          );

          this.redirectTimer = setTimeout(() => {
            void this.router.navigate(['/login']);
          }, 1200);
        },
        error: (err: { status?: number }) => {
          this.isSubmitting.set(false);
          this.handleRegistrationError(err);
        },
      });
  }

  private handleRegistrationError(err: { status?: number }): void {
    if (err?.status === 409) {
      this.errorMessage.set(
        this.text(
          'emailAlreadyRegistered',
          'Este email já está registado. Faça login ou recupere a password.',
        ),
      );
      return;
    }

    if (err?.status === 400) {
      this.errorMessage.set(
        this.text(
          'registrationInvalid',
          'Alguns dados não foram aceites. Verifique o formulário.',
        ),
      );
      return;
    }

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
        'registrationGenericError',
        'Não foi possível criar a conta neste momento. Tente novamente.',
      ),
    );
  }

  private focusFirstInvalidField(): void {
    const order = ['name', 'email', 'password', 'confirm-password', 'agree-terms'];

    requestAnimationFrame(() => {
      for (const id of order) {
        const element = this.document.getElementById(id) as HTMLElement | null;
        if (!element) continue;

        if (id === 'confirm-password' && !this.isConfirmPasswordInvalid()) {
          continue;
        }

        element.focus();
        break;
      }
    });
  }
}