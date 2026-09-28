import { CommonModule } from '@angular/common';
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
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from './auth.service';
import { Locale, TranslationService } from '../shared/translation.service';

interface LoginFormValue {
  username: string;
  password: string;
  rememberMe: boolean;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <section class="auth-showcase" aria-labelledby="showcase-title">
        <div class="showcase-inner">
          <a class="brand" routerLink="/login" [attr.aria-label]="text('brandAria', 'ratelimiter')">
            <span class="brand-symbol" aria-hidden="true">
              <svg viewBox="0 0 32 32" role="img">
                <path d="M7 21V12M13 25V7M19 20V11M25 23V9" />
              </svg>
            </span>
            <span class="brand-name">ratelimiter</span>
          </a>

          <div class="showcase-content">
            <div class="eyebrow">
              <span class="eyebrow-dot" aria-hidden="true"></span>
              {{ text('realTimeProtection', 'PROTEÇÃO EM TEMPO REAL') }}
            </div>

            <h2 id="showcase-title">
              {{ text('showcaseTitleLine1', 'Controlo de tráfego') }}
              <span>{{ text('showcaseTitleLine2', 'sem ruído.') }}</span>
            </h2>

            <p class="showcase-copy">
              {{ text('showcaseCopy', 'Monitorize, ajuste e proteja cada pedido da sua API num único workspace.') }}
            </p>

            <div class="product-visual" aria-hidden="true">
              <div class="visual-topline">
                <span class="visual-kicker">TRAFFIC CONTROL</span>
                <span class="visual-status">
                  <span class="status-dot"></span>
                  {{ text('active', 'ACTIVE') }}
                </span>
              </div>

              <div class="traffic-graph">
                <span class="graph-grid-scan"></span>
                <span class="graph-line graph-line-a"></span>
                <span class="graph-line graph-line-b"></span>
                <span class="graph-node node-a"></span>
                <span class="graph-node node-b"></span>
                <span class="graph-node node-c"></span>
                <span class="graph-node node-d"></span>
                <span class="packet packet-a">GET /api</span>
                <span class="packet packet-b">429 LIMIT</span>
                <span class="packet packet-c">200 OK</span>
              </div>

              <div class="traffic-signal-strip">
                <span><i></i> LIVE ENGINE</span>
                <span>42 RULES</span>
                <span>18ms AVG</span>
              </div>

              <div class="visual-footer">
                <span>
                  <small>DETECT</small>
                  <strong>Traffic</strong>
                </span>
                <span>
                  <small>LIMIT</small>
                  <strong>Rules</strong>
                </span>
                <span>
                  <small>PROTECT</small>
                  <strong>API</strong>
                </span>
              </div>
            </div>
          </div>

          <div class="showcase-footer">
            <span>{{ text('showcaseFooterTagline', 'API traffic, under control.') }}</span>
            <span>© 2026 ratelimiter</span>
          </div>
        </div>
      </section>

      <section class="auth-area" [attr.aria-label]="text('authentication', 'Autenticação')">
        <div class="auth-area-inner">
          <header class="auth-header">
            <span class="secure-badge">
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M6 8.5V7a4 4 0 0 1 8 0v1.5M5 8.5h10v8H5z" />
                <circle cx="10" cy="12.5" r="1.1" />
              </svg>
              {{ text('secureWorkspace', 'WORKSPACE SEGURO') }}
            </span>

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

          <div class="auth-card">
            <div class="auth-card-header">
              <p class="eyebrow">{{ text('workspace', 'WORKSPACE') }}</p>
              <h1>{{ text('welcomeBack', 'Bem-vindo de volta') }}</h1>
              <p class="intro">
                {{ text('signInDescription', 'Entre no seu workspace para gerir o tráfego da sua API.') }}
              </p>
            </div>

            @if (error()) {
              <div
                class="error-banner"
                role="alert"
                aria-live="assertive"
                tabindex="-1"
                #errorBanner
              >
                <span class="error-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20">
                    <path d="M10 3.5 17 16H3z" />
                    <path d="M10 7.2v4.2M10 14.1v.2" />
                  </svg>
                </span>
                <div>
                  <strong>{{ text('loginError', 'Não foi possível entrar') }}</strong>
                  <p>{{ error() }}</p>
                </div>
                <button
                  type="button"
                  class="icon-button"
                  (click)="clearError()"
                  [attr.aria-label]="text('close', 'Fechar')"
                >
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="m5 5 10 10M15 5 5 15" />
                  </svg>
                </button>
              </div>
            }

            <form
              [formGroup]="loginForm"
              (ngSubmit)="onLogin()"
              novalidate
              class="auth-form"
              aria-describedby="auth-help"
            >
              <p id="auth-help" class="sr-only">
                {{ text('authHelp', 'Preencha o nome de utilizador e a password para continuar.') }}
              </p>

              <div class="form-field">
                <label for="username" class="form-label">
                  <span>{{ text('username', 'Nome de utilizador') }}</span>
                  <span class="required" aria-hidden="true">*</span>
                </label>

                <div class="input-shell">
                  <span class="input-icon" aria-hidden="true">
                    <svg viewBox="0 0 20 20">
                      <circle cx="10" cy="7" r="3.2" />
                      <path d="M4.4 17c.6-3 2.5-4.6 5.6-4.6s5 1.6 5.6 4.6" />
                    </svg>
                  </span>

                  <input
                    #usernameInput
                    id="username"
                    type="text"
                    formControlName="username"
                    class="form-input"
                    [class.invalid]="isFieldInvalid('username')"
                    [attr.aria-invalid]="isFieldInvalid('username')"
                    [attr.aria-describedby]="isFieldInvalid('username') ? 'username-error' : null"
                    autocomplete="username"
                    required
                    [attr.aria-required]="true"
                    autocapitalize="none"
                    autocorrect="off"
                    spellcheck="false"
                    [attr.readonly]="isBusy() ? true : null"
                    (input)="clearError()"
                  />
                </div>

                @if (isFieldInvalid('username')) {
                  <span id="username-error" class="field-error">
                    {{ getFieldError('username') }}
                  </span>
                }
              </div>

              <div class="form-field">
                <div class="label-row">
                  <label for="password" class="form-label">
                    <span>{{ text('password', 'Password') }}</span>
                    <span class="required" aria-hidden="true">*</span>
                  </label>

                  <a routerLink="/recuperar-password" class="text-link">
                    {{ text('forgotPassword', 'Esqueceu a password?') }}
                  </a>
                </div>

                <div class="input-shell">
                  <span class="input-icon" aria-hidden="true">
                    <svg viewBox="0 0 20 20">
                      <path d="M5.5 8.5V6.8a4.5 4.5 0 0 1 9 0v1.7M4.5 8.5h11v7h-11z" />
                    </svg>
                  </span>

                  <input
                    #passwordInput
                    id="password"
                    [type]="showPassword() ? 'text' : 'password'"
                    formControlName="password"
                    class="form-input password-input"
                    [class.invalid]="isFieldInvalid('password')"
                    [attr.aria-invalid]="isFieldInvalid('password')"
                    [attr.aria-describedby]="isFieldInvalid('password') ? 'password-error' : null"
                    autocomplete="current-password"
                    required
                    [attr.aria-required]="true"
                    autocapitalize="none"
                    autocorrect="off"
                    spellcheck="false"
                    [attr.readonly]="isBusy() ? true : null"
                    (input)="clearError()"
                  />

                  <button
                    type="button"
                    class="password-toggle"
                    (click)="togglePasswordVisibility()"
                    [attr.aria-label]="showPassword()
                      ? text('hidePassword', 'Ocultar password')
                      : text('showPassword', 'Mostrar password')"
                    [attr.aria-pressed]="showPassword()"
                    [disabled]="isBusy()"
                  >
                    @if (showPassword()) {
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M3 10s2.4-4 7-4 7 4 7 4-2.4 4-7 4-7-4-7-4z" />
                        <path d="m3.5 3.5 13 13" />
                      </svg>
                    } @else {
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M3 10s2.4-4 7-4 7 4 7 4-2.4 4-7 4-7-4-7-4z" />
                        <circle cx="10" cy="10" r="1.7" />
                      </svg>
                    }
                  </button>
                </div>

                @if (isFieldInvalid('password')) {
                  <span id="password-error" class="field-error">
                    {{ getFieldError('password') }}
                  </span>
                }
              </div>

              <div class="form-options">
                <label class="remember-control">
                  <input
                    id="remember-me"
                    type="checkbox"
                    formControlName="rememberMe"
                    class="remember-input"
                    [disabled]="isBusy()"
                  />
                  <span class="custom-checkbox" aria-hidden="true"></span>
                  <span>{{ text('rememberMe', 'Lembrar-me neste dispositivo') }}</span>
                </label>
              </div>

              <button
                type="submit"
                class="submit-button"
                [disabled]="isBusy() || loginForm.invalid"
                [attr.aria-busy]="isSubmitting()"
              >
                @if (isSubmitting()) {
                  <span class="button-spinner" aria-hidden="true"></span>
                  <span>{{ text('signingIn', 'A entrar…') }}</span>
                } @else {
                  <span>{{ text('signIn', 'Entrar no workspace') }}</span>
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M4 10h11M10 5l5 5-5 5" />
                  </svg>
                }
              </button>
            </form>

            <p class="signup">
              {{ text('noAccount', 'Ainda não tem conta?') }}
              <a routerLink="/criar-conta" class="signup-link">
                {{ text('createAccount', 'Criar conta') }}
              </a>
            </p>
          </div>

          <footer class="auth-footer">
            <span>{{ text('helpQuestion', 'Precisa de ajuda?') }}</span>
            <a routerLink="/recuperar-password">
              {{ text('recoverAccess', 'Recuperar acesso') }}
            </a>
          </footer>
        </div>
      </section>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100dvh;
      font-family:
        Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI",
        sans-serif;
      color: #102b41;
      background: #f5f8fb;
    }

    * { box-sizing: border-box; }

    button, input, select { font: inherit; }

    .auth-page {
      min-height: 100dvh;
      display: grid;
      grid-template-columns: minmax(440px, 0.95fr) minmax(500px, 1.05fr);
      background:
        radial-gradient(circle at 20% 10%, rgba(77, 208, 225, 0.08), transparent 34%),
        #f5f8fb;
    }

    .auth-showcase {
      position: relative;
      overflow: hidden;
      color: #effcff;
      background:
        radial-gradient(circle at 15% 20%, rgba(77, 211, 229, 0.18), transparent 26%),
        radial-gradient(circle at 90% 80%, rgba(21, 113, 147, 0.26), transparent 34%),
        linear-gradient(160deg, #082d49 0%, #063f5d 48%, #075c78 100%);
    }

    .auth-showcase::before {
      content: "";
      position: absolute;
      inset: 0;
      opacity: 0.16;
      background-image:
        linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.09) 1px, transparent 1px);
      background-size: 52px 52px;
      mask-image: linear-gradient(to bottom, rgba(0,0,0,0.75), transparent 94%);
      pointer-events: none;
    }

    .auth-showcase::after {
      content: "";
      position: absolute;
      width: 420px;
      height: 420px;
      right: -180px;
      top: -150px;
      border-radius: 50%;
      border: 1px solid rgba(142, 235, 240, 0.2);
      box-shadow:
        0 0 0 42px rgba(142, 235, 240, 0.045),
        0 0 0 92px rgba(142, 235, 240, 0.025);
      pointer-events: none;
    }

    .showcase-inner {
      position: relative;
      z-index: 1;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      padding: 32px clamp(32px, 5vw, 82px) 26px;
    }

    .brand {
      display: inline-flex;
      width: fit-content;
      align-items: center;
      gap: 11px;
      color: #f4fdff;
      text-decoration: none;
    }

    .brand-symbol {
      width: 38px;
      height: 38px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(143, 236, 239, 0.28);
      border-radius: 12px;
      background: rgba(2, 28, 45, 0.34);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
    }

    .brand-symbol svg {
      width: 21px;
      height: 21px;
      fill: none;
      stroke: #76e7eb;
      stroke-linecap: round;
      stroke-width: 2.8;
    }

    .brand-name {
      font-size: 21px;
      font-weight: 700;
      letter-spacing: -0.035em;
    }

    .showcase-content {
      width: min(570px, 100%);
      margin: auto 0;
      padding: 70px 0 44px;
    }

    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 17px;
      color: #72e8ec;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.18em;
    }

    .eyebrow-dot {
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: #72e8ec;
      box-shadow: 0 0 0 5px rgba(114, 232, 236, 0.1);
      animation: live-pulse 2.2s ease-in-out infinite;
    }

    .showcase-content h2 {
      max-width: 570px;
      margin: 0;
      color: #f7fdff;
      font-size: clamp(46px, 5.3vw, 78px);
      font-weight: 650;
      line-height: 0.98;
      letter-spacing: -0.065em;
    }

    .showcase-content h2 span {
      display: block;
      color: #79e7eb;
    }

    .showcase-copy {
      max-width: 470px;
      margin: 24px 0 0;
      color: #b8dae5;
      font-size: 16px;
      line-height: 1.7;
    }

    .product-visual {
      position: relative;
      isolation: isolate;
      overflow: hidden;
      width: min(500px, 100%);
      margin-top: 46px;
      padding: 17px;
      border: 1px solid rgba(194, 243, 246, 0.16);
      border-radius: 18px;
      background:
        linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025)),
        rgba(4, 35, 54, 0.38);
      box-shadow:
        0 24px 70px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255,255,255,0.08);
      backdrop-filter: blur(16px);
    }

    .product-visual::before {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        radial-gradient(circle at 18% 35%, rgba(114,232,236,.08), transparent 22%),
        radial-gradient(circle at 82% 62%, rgba(114,232,236,.06), transparent 24%);
      opacity: .9;
    }

    .visual-topline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 22px;
    }

    .visual-kicker,
    .visual-status {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.14em;
    }

    .visual-kicker { color: #8bbac6; }

    .visual-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #8eecee;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #8eecee;
      box-shadow: 0 0 0 4px rgba(142, 236, 238, 0.1);
      animation: live-pulse 1.8s ease-in-out infinite;
    }

    .traffic-graph {
      position: relative;
      height: 118px;
      overflow: hidden;
      border-top: 1px solid rgba(255,255,255,0.06);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      background:
        linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px);
      background-size: 42px 28px;
    }

    .graph-grid-scan {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to bottom,
        transparent 0%,
        transparent 46%,
        rgba(119,232,236,.12) 50%,
        transparent 54%,
        transparent 100%
      );
      transform: translateY(-100%);
      animation: ratelimiter-scan 4.8s linear infinite;
      pointer-events: none;
    }

    .graph-line {
      position: absolute;
      left: -5%;
      right: -5%;
      height: 2px;
      transform-origin: center;
      background: linear-gradient(90deg, transparent, #7ae8eb 15%, #7ae8eb 72%, transparent);
      filter: drop-shadow(0 0 7px rgba(122,232,235,0.5));
    }

    .graph-line-a { top: 54%; transform: rotate(-5deg); }
    .graph-line-b { top: 45%; opacity: 0.34; transform: rotate(11deg); }

    .graph-node {
      position: absolute;
      width: 8px;
      height: 8px;
      border: 2px solid #b8fbfb;
      border-radius: 50%;
      background: #07536f;
      box-shadow: 0 0 0 5px rgba(184,251,251,0.08);
      animation: ratelimiter-node 2.8s ease-in-out infinite;
    }

    .node-a { left: 28%; top: 47%; }
    .node-b { left: 57%; top: 40%; animation-delay: -.9s; }
    .node-c { right: 17%; top: 56%; animation-delay: -1.7s; }
    .node-d { left: 76%; top: 31%; animation-delay: -2.3s; }

    .packet {
      position: absolute;
      z-index: 3;
      padding: 4px 7px;
      border: 1px solid rgba(130,235,239,.16);
      border-radius: 5px;
      color: rgba(204,250,251,.72);
      background: rgba(3,33,50,.62);
      box-shadow: 0 6px 18px rgba(0,0,0,.10);
      font: 700 7px/1 Inter, ui-sans-serif, sans-serif;
      letter-spacing: .08em;
      text-transform: uppercase;
      white-space: nowrap;
      opacity: 0;
      animation: ratelimiter-packet 7s linear infinite;
    }

    .packet-a { left: 4%; top: 24%; }
    .packet-b { left: 36%; top: 64%; animation-delay: -2.4s; }
    .packet-c { left: 68%; top: 19%; animation-delay: -4.8s; }

    .traffic-signal-strip {
      display: grid;
      grid-template-columns: 1.4fr 1fr 1fr;
      gap: 8px;
      margin-top: 10px;
      padding: 8px 10px;
      border: 1px solid rgba(122,232,235,.09);
      border-radius: 8px;
      background: rgba(2,25,39,.26);
      color: rgba(188,239,242,.58);
      font-size: 8px;
      font-weight: 800;
      letter-spacing: .11em;
    }

    .traffic-signal-strip span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }

    .traffic-signal-strip i {
      width: 5px;
      height: 5px;
      flex: 0 0 5px;
      border-radius: 999px;
      background: #72e8ec;
      box-shadow: 0 0 0 4px rgba(114,232,236,.08);
      animation: live-pulse 1.8s ease-in-out infinite;
    }

    .visual-footer {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      padding-top: 15px;
    }

    .visual-footer span { display: grid; gap: 4px; }

    .visual-footer small {
      color: #7da9b7;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.14em;
    }

    .visual-footer strong {
      color: #e4f8fb;
      font-size: 12px;
      font-weight: 600;
    }

    .showcase-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      color: #82aebb;
      font-size: 11px;
    }

    .auth-area {
      min-width: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px clamp(24px, 5vw, 84px);
      background:
        radial-gradient(circle at 85% 15%, rgba(23, 154, 183, 0.05), transparent 28%),
        #f5f8fb;
    }

    .auth-area:has(.form-input:focus) {
      background:
        radial-gradient(circle at 72% 40%, rgba(21,154,183,.045), transparent 30%),
        #f5f8fb;
    }

    .auth-area-inner {
      width: min(470px, 100%);
      min-height: calc(100dvh - 64px);
      display: flex;
      flex-direction: column;
    }

    .auth-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .secure-badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      color: #6f8190;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.09em;
      text-transform: uppercase;
    }

    .secure-badge svg {
      width: 15px;
      height: 15px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.5;
      stroke-linecap: round;
      stroke-linejoin: round;
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

    .language-option:focus-visible {
      outline: 2px solid #159ab7;
      outline-offset: 1px;
      border-radius: 7px;
    }

    .auth-card {
      width: 100%;
      margin: auto 0;
      padding: 44px 0 28px;
    }

    .auth-card-header { margin-bottom: 30px; }

    .auth-card-header .eyebrow {
      margin-bottom: 14px;
      color: #138baa;
    }

    .auth-card h1 {
      margin: 0;
      color: #0d2b42;
      font-size: clamp(32px, 4vw, 44px);
      font-weight: 650;
      line-height: 1.05;
      letter-spacing: -0.05em;
    }

    .intro {
      max-width: 420px;
      margin: 12px 0 0;
      color: #718391;
      font-size: 14px;
      line-height: 1.6;
    }

    .auth-form {
      display: grid;
      gap: 21px;
    }

    .form-field {
      display: grid;
      gap: 8px;
    }

    .label-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 16px;
    }

    .form-label {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #27475b;
      font-size: 12px;
      font-weight: 700;
    }

    .required { color: #138baa; }

    .text-link,
    .signup-link,
    .auth-footer a {
      color: #0b7897;
      font-weight: 700;
      text-decoration: none;
    }

    .text-link {
      font-size: 11px;
      white-space: nowrap;
    }

    .text-link:hover,
    .signup-link:hover,
    .auth-footer a:hover {
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    .input-shell {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      display: grid;
      place-items: center;
      width: 18px;
      height: 18px;
      transform: translateY(-50%);
      color: #8ba0ad;
      pointer-events: none;
    }

    .input-icon svg {
      width: 17px;
      height: 17px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.55;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .form-input {
      width: 100%;
      min-height: 50px;
      padding: 0 14px 0 43px;
      border: 1px solid #d0dce4;
      border-radius: 12px;
      outline: 0;
      background: #fff;
      color: #17364b;
      font-size: 14px;
      transition:
        border-color 160ms ease,
        box-shadow 160ms ease,
        background 160ms ease;
    }

    .form-input::placeholder { color: #a1afb9; }
    .form-input:hover { border-color: #aac2cf; }

    .form-input:focus {
      border-color: #159ab7;
      box-shadow: 0 0 0 4px rgba(21, 154, 183, 0.11);
    }

    .form-input.invalid { border-color: #c24f68; }

    .form-input.invalid:focus {
      box-shadow: 0 0 0 4px rgba(194, 79, 104, 0.11);
    }

    .form-input[readonly] { background: #f7fafc; }

    .password-input { padding-right: 47px; }

    .password-toggle {
      position: absolute;
      right: 8px;
      top: 50%;
      width: 34px;
      height: 34px;
      display: grid;
      place-items: center;
      transform: translateY(-50%);
      border: 0;
      border-radius: 8px;
      color: #7f929f;
      background: transparent;
      cursor: pointer;
      transition: background .15s ease, color .15s ease;
    }

    .password-toggle:hover:not(:disabled) {
      color: #0f7895;
      background: #eef7fa;
    }

    .password-toggle:focus-visible {
      outline: 2px solid #159ab7;
      outline-offset: 1px;
      border-radius: 8px;
    }

    .password-toggle:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }

    .password-toggle svg {
      width: 17px;
      height: 17px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.55;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .field-error {
      color: #b03e57;
      font-size: 11px;
      line-height: 1.35;
    }

    .form-options { margin-top: -2px; }

    .remember-control {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 9px;
      color: #607684;
      font-size: 12px;
      cursor: pointer;
      user-select: none;
    }

    .remember-input {
      position: absolute;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
    }

    .custom-checkbox {
      width: 18px;
      height: 18px;
      flex: 0 0 18px;
      display: inline-grid;
      place-items: center;
      border: 1px solid #c6d5de;
      border-radius: 6px;
      background: #fff;
      transition:
        background 150ms ease,
        border-color 150ms ease,
        box-shadow 150ms ease;
    }

    .remember-input:checked + .custom-checkbox {
      border-color: #0e819f;
      background: #0e819f;
      box-shadow: inset 0 0 0 3px #fff;
    }

    .remember-input:focus-visible + .custom-checkbox {
      box-shadow:
        0 0 0 3px rgba(21,154,183,0.14),
        inset 0 0 0 2px #fff;
    }

    .submit-button {
      width: 100%;
      min-height: 50px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      margin-top: 2px;
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

    .submit-button:hover:not(:disabled) {
      transform: translateY(-1px);
      background: linear-gradient(180deg, #1390af 0%, #0c7897 100%);
      box-shadow:
        0 11px 22px rgba(11, 120, 151, 0.21),
        inset 0 1px 0 rgba(255,255,255,0.18);
    }

    .submit-button:active:not(:disabled) { transform: translateY(0); }

    .submit-button:focus-visible,
    .demo-button:focus-visible,
    .icon-button:focus-visible,
    .text-link:focus-visible,
    .signup-link:focus-visible,
    .auth-footer a:focus-visible {
      outline: 2px solid #159ab7;
      outline-offset: 3px;
      border-radius: 6px;
    }

    .submit-button:disabled {
      background: #d4e2e9;
      border-color: #d4e2e9;
      color: #fff;
      cursor: not-allowed;
      box-shadow: none;
    }

    .submit-button svg,
    .demo-arrow {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.7;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .button-spinner {
      width: 15px;
      height: 15px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 650ms linear infinite;
    }

    .button-spinner.dark {
      border-color: rgba(12, 123, 154, 0.25);
      border-top-color: #0c7b9a;
    }

    .divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 28px 0 17px;
      color: #98a7b1;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }

    .divider::before,
    .divider::after {
      content: "";
      height: 1px;
      flex: 1;
      background: #e0e7ec;
    }

    .demo-button {
      width: 100%;
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border: 1px solid #d9e3e9;
      border-radius: 12px;
      text-align: left;
      color: #254458;
      background: rgba(255,255,255,0.72);
      cursor: pointer;
      transition:
        border-color 150ms ease,
        background 150ms ease,
        transform 150ms ease;
    }

    .demo-button:hover:not(:disabled) {
      border-color: #b9ced8;
      background: #fff;
      transform: translateY(-1px);
    }

    .demo-button:disabled {
      cursor: not-allowed;
      opacity: 0.65;
    }

    .demo-icon {
      width: 36px;
      height: 36px;
      display: grid;
      place-items: center;
      border: 1px solid #dbe7ec;
      border-radius: 10px;
      color: #0c7b9a;
      background: #eff8fa;
    }

    .demo-icon svg {
      width: 17px;
      height: 17px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.5;
      stroke-linecap: round;
    }

    .demo-copy { display: grid; gap: 2px; }

    .demo-copy strong {
      font-size: 12px;
      font-weight: 800;
    }

    .demo-copy small {
      color: #8596a1;
      font-size: 10px;
      line-height: 1.4;
    }

    .demo-arrow { color: #8799a5; }

    .signup {
      margin: 18px 0 0;
      color: #82919b;
      text-align: center;
      font-size: 12px;
    }

    .auth-footer {
      display: flex;
      justify-content: center;
      gap: 6px;
      padding-top: 12px;
      color: #98a5ae;
      font-size: 10px;
    }

    .auth-footer a { font-size: 10px; }

    .error-banner {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: start;
      gap: 10px;
      margin: 0 0 22px;
      padding: 12px 13px;
      border: 1px solid #efb7c3;
      border-radius: 12px;
      color: #893247;
      background: #fff2f4;
      animation: slide-down 180ms ease-out;
    }

    .error-banner strong {
      display: block;
      margin-bottom: 3px;
      font-size: 11px;
      font-weight: 800;
    }

    .error-banner p {
      margin: 0;
      font-size: 11px;
      line-height: 1.45;
    }

    .error-icon {
      width: 20px;
      height: 20px;
      display: grid;
      place-items: center;
      color: #b03e57;
    }

    .error-icon svg {
      width: 18px;
      height: 18px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.55;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .icon-button {
      width: 28px;
      height: 28px;
      display: grid;
      place-items: center;
      border: 0;
      border-radius: 7px;
      color: #a55b6c;
      background: transparent;
      cursor: pointer;
      transition: background .15s ease;
    }

    .icon-button:hover { background: rgba(176, 62, 87, 0.08); }

    .icon-button svg {
      width: 15px;
      height: 15px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.6;
      stroke-linecap: round;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0,0,0,0);
      white-space: nowrap;
      border: 0;
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
    @keyframes ratelimiter-scan {
      to { transform: translateY(100%); }
    }
    @keyframes ratelimiter-node {
      0%, 100% { transform: scale(1); box-shadow: 0 0 0 5px rgba(184,251,251,.08); }
      50% { transform: scale(1.16); box-shadow: 0 0 0 7px rgba(184,251,251,.045), 0 0 18px rgba(114,232,236,.14); }
    }
    @keyframes ratelimiter-packet {
      0% { transform: translate3d(-18px, 8px, 0); opacity: 0; }
      12% { opacity: .78; }
      68% { opacity: .78; }
      100% { transform: translate3d(125px, -18px, 0); opacity: 0; }
    }

    @media (max-width: 920px) {
      .auth-page { grid-template-columns: 1fr; }
      .auth-showcase { min-height: 360px; }
      .showcase-inner { min-height: 360px; padding: 26px 28px 22px; }
      .showcase-content { padding: 48px 0 36px; }
      .showcase-content h2 { font-size: clamp(42px, 8vw, 66px); }
      .product-visual { display: none; }
      .auth-area { padding: 24px 24px 36px; }
      .auth-area-inner { min-height: auto; }
      .auth-card { margin: 0; padding: 38px 0 20px; }
    }

    @media (max-width: 560px) {
      .auth-showcase { min-height: auto; }
      .showcase-inner { min-height: 0; padding: 22px 20px 18px; }
      .brand-symbol { width: 34px; height: 34px; }
      .brand-name { font-size: 19px; }
      .showcase-content { padding: 56px 0 42px; }
      .showcase-content h2 { font-size: 43px; }
      .showcase-copy { margin-top: 18px; font-size: 14px; }
      .showcase-footer { font-size: 9px; }
      .auth-area { padding: 18px 20px 24px; }
      .auth-header { align-items: flex-start; }
      .secure-badge { max-width: 130px; }
      .auth-card { padding-top: 34px; }
      .auth-card h1 { font-size: 34px; }
      .label-row { gap: 10px; }
      .text-link { font-size: 10px; }
      .auth-footer { padding-top: 4px; }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: .01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: .01ms !important;
      }
      .packet { opacity: .45; }
    }
  `],
})
export class LoginComponent implements OnInit, OnDestroy {
  readonly i18n = inject(TranslationService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('usernameInput') private usernameInput?: ElementRef<HTMLInputElement>;
  @ViewChild('passwordInput') private passwordInput?: ElementRef<HTMLInputElement>;
  @ViewChild('errorBanner') private errorBanner?: ElementRef<HTMLDivElement>;

  loginForm!: FormGroup;

  readonly showPassword = signal(false);
  readonly isSubmitting = signal(false);
  readonly error = signal('');

  readonly availableLocales: Array<{ value: Locale; label: string }> = [
    { value: 'pt', label: 'PT' },
    { value: 'en', label: 'EN' },
    { value: 'zh', label: '中文' },
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.loadRememberedUsername();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isBusy(): boolean {
    return this.isSubmitting();
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
        brandAria: 'ratelimiter',
        realTimeProtection: 'PROTEÇÃO EM TEMPO REAL',
        showcaseTitleLine1: 'Controlo de tráfego',
        showcaseTitleLine2: 'sem ruído.',
        showcaseCopy:
          'Monitorize, ajuste e proteja cada pedido da sua API num único workspace.',
        showcaseFooterTagline: 'API traffic, under control.',
        active: 'ACTIVE',
        authentication: 'Autenticação',
        secureWorkspace: 'WORKSPACE SEGURO',
        language: 'Idioma',
        workspace: 'WORKSPACE',
        welcomeBack: 'Bem-vindo de volta',
        signInDescription:
          'Entre no seu workspace para gerir o tráfego da sua API.',
        close: 'Fechar',
        loginError: 'Não foi possível entrar',
        authHelp:
          'Preencha o nome de utilizador e a password para continuar.',
        username: 'Nome de utilizador',
        password: 'Password',
        forgotPassword: 'Esqueceu a password?',
        rememberMe: 'Lembrar-me neste dispositivo',
        signingIn: 'A entrar…',
        signIn: 'Entrar no workspace',
        or: 'ou',
        noAccount: 'Ainda não tem conta?',
        createAccount: 'Criar conta',
        helpQuestion: 'Precisa de ajuda?',
        recoverAccess: 'Recuperar acesso',
        showPassword: 'Mostrar password',
        hidePassword: 'Ocultar password',
        invalidCredentials: 'Nome de utilizador ou password incorretos.',
        tooManyAttempts:
          'Demasiadas tentativas de login. Aguarde alguns instantes e tente novamente.',
        serverUnavailable:
          'Não foi possível contactar o servidor. Verifique a ligação e tente novamente.',
        genericLoginError:
          'Ocorreu um erro ao iniciar sessão. Tente novamente.',
        requiredUsername: 'O nome de utilizador é obrigatório.',
        requiredPassword: 'A password é obrigatória.',
        minUsername:
          'O nome de utilizador deve ter pelo menos {n} caracteres.',
        minPassword: 'A password deve ter pelo menos {n} caracteres.',
        invalidField: 'Campo inválido.',
      },
      en: {
        brandAria: 'ratelimiter',
        realTimeProtection: 'REAL-TIME PROTECTION',
        showcaseTitleLine1: 'Traffic control',
        showcaseTitleLine2: 'without the noise.',
        showcaseCopy:
          'Monitor, adjust and protect every request to your API in a single workspace.',
        showcaseFooterTagline: 'API traffic, under control.',
        active: 'ACTIVE',
        authentication: 'Authentication',
        secureWorkspace: 'SECURE WORKSPACE',
        language: 'Language',
        workspace: 'WORKSPACE',
        welcomeBack: 'Welcome back',
        signInDescription:
          'Sign in to your workspace to manage your API traffic.',
        close: 'Close',
        loginError: 'Unable to sign in',
        authHelp: 'Enter your username and password to continue.',
        username: 'Username',
        password: 'Password',
        forgotPassword: 'Forgot password?',
        rememberMe: 'Remember me on this device',
        signingIn: 'Signing in…',
        signIn: 'Sign in to workspace',
        or: 'or',
        noAccount: 'New here?',
        createAccount: 'Create account',
        helpQuestion: 'Need help?',
        recoverAccess: 'Recover access',
        showPassword: 'Show password',
        hidePassword: 'Hide password',
        invalidCredentials: 'Incorrect username or password.',
        tooManyAttempts:
          'Too many sign-in attempts. Wait a moment and try again.',
        serverUnavailable:
          'The server could not be reached. Check your connection and try again.',
        genericLoginError: 'Something went wrong while signing in. Try again.',
        requiredUsername: 'Username is required.',
        requiredPassword: 'Password is required.',
        minUsername: 'Username must be at least {n} characters.',
        minPassword: 'Password must be at least {n} characters.',
        invalidField: 'Invalid field.',
      },
      zh: {
        brandAria: 'ratelimiter',
        realTimeProtection: '实时防护',
        showcaseTitleLine1: '流量控制',
        showcaseTitleLine2: '无噪音。',
        showcaseCopy: '在一个工作区中监控、调整并保护 API 的每个请求。',
        showcaseFooterTagline: 'API 流量，尽在掌控。',
        active: '运行中',
        authentication: '身份验证',
        secureWorkspace: '安全工作区',
        language: '语言',
        workspace: '工作区',
        welcomeBack: '欢迎回来',
        signInDescription: '登录工作区以管理 API 流量。',
        close: '关闭',
        loginError: '无法登录',
        authHelp: '请输入用户名和密码继续。',
        username: '用户名',
        password: '密码',
        forgotPassword: '忘记密码？',
        rememberMe: '在此设备上记住我',
        signingIn: '正在登录…',
        signIn: '进入工作区',
        or: '或',
        noAccount: '还没有账户？',
        createAccount: '创建账户',
        helpQuestion: '需要帮助？',
        recoverAccess: '恢复访问',
        showPassword: '显示密码',
        hidePassword: '隐藏密码',
        invalidCredentials: '用户名或密码不正确。',
        tooManyAttempts: '登录尝试次数过多，请稍后再试。',
        serverUnavailable: '无法连接服务器，请检查网络连接后重试。',
        genericLoginError: '登录时发生错误，请重试。',
        requiredUsername: '用户名为必填项。',
        requiredPassword: '密码为必填项。',
        minUsername: '用户名至少需要 {n} 个字符。',
        minPassword: '密码至少需要 {n} 个字符。',
        invalidField: '字段无效。',
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

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  private loadRememberedUsername(): void {
    try {
      const remembered = localStorage.getItem(
        'ratelimiter_remembered_username',
      );

      if (remembered) {
        this.loginForm.patchValue({
          username: remembered,
          rememberMe: true,
        });
      }
    } catch {
      // Storage can be unavailable in private/restricted browser contexts.
    }
  }

  togglePasswordVisibility(): void {
    if (this.isBusy()) return;
    this.showPassword.update((visible) => !visible);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm?.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const control = this.loginForm.get(fieldName);

    if (!control?.errors) {
      return '';
    }

    if (control.errors['required']) {
      return this.text(
        fieldName === 'username' ? 'requiredUsername' : 'requiredPassword',
        fieldName === 'username'
          ? 'O nome de utilizador é obrigatório.'
          : 'A password é obrigatória.',
      );
    }

    if (control.errors['minlength']) {
      const requiredLength = control.errors['minlength'].requiredLength;
      const key = fieldName === 'username' ? 'minUsername' : 'minPassword';
      const fallback =
        fieldName === 'username'
          ? `O nome de utilizador deve ter pelo menos ${requiredLength} caracteres.`
          : `A password deve ter pelo menos ${requiredLength} caracteres.`;

      return this.text(key, fallback, { n: requiredLength });
    }

    return this.text('invalidField', 'Campo inválido.');
  }

  clearError(): void {
    if (this.error()) {
      this.error.set('');
    }
  }

  onLanguageChange(locale: Locale): void {
    if (this.isBusy() || locale === this.i18n.locale()) return;
    this.i18n.setLocale(locale);
  }

  onLogin(): void {
    this.clearError();

    if (this.isBusy()) return;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.focusFirstInvalidField();
      return;
    }

    this.isSubmitting.set(true);

    const { username, password, rememberMe } =
      this.loginForm.value as LoginFormValue;

    this.persistRememberedUsername(username, rememberMe);

    this.auth
      .login(username.trim(), password)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          const returnUrl =
            this.route.snapshot.queryParamMap.get('returnUrl') || '/';

          void this.router.navigateByUrl(returnUrl);
        },
        error: (err: unknown) => {
          this.isSubmitting.set(false);
          this.handleLoginError(err);
        },
      });
  }

  private persistRememberedUsername(
    username: string,
    rememberMe: boolean,
  ): void {
    try {
      if (rememberMe) {
        localStorage.setItem(
          'ratelimiter_remembered_username',
          username.trim(),
        );
      } else {
        localStorage.removeItem('ratelimiter_remembered_username');
      }
    } catch {
      // Ignore storage failures; authentication itself should still work.
    }
  }

  private focusFirstInvalidField(): void {
    requestAnimationFrame(() => {
      const username = this.loginForm.get('username');
      const password = this.loginForm.get('password');

      if (username?.invalid) {
        this.usernameInput?.nativeElement.focus();
      } else if (password?.invalid) {
        this.passwordInput?.nativeElement.focus();
      }
    });
  }

  private handleLoginError(err: unknown): void {
    const status =
      typeof err === 'object' && err !== null && 'status' in err
        ? Number((err as { status?: unknown }).status)
        : 0;

    if (status === 401) {
      this.error.set(
        this.text(
          'invalidCredentials',
          'Nome de utilizador ou password incorretos.',
        ),
      );
    } else if (status === 429) {
      this.error.set(
        this.text(
          'tooManyAttempts',
          'Demasiadas tentativas de login. Aguarde alguns instantes e tente novamente.',
        ),
      );
    } else if (status === 0) {
      this.error.set(
        this.text(
          'serverUnavailable',
          'Não foi possível contactar o servidor. Verifique a ligação e tente novamente.',
        ),
      );
    } else {
      this.error.set(
        this.text(
          'genericLoginError',
          'Ocorreu um erro ao iniciar sessão. Tente novamente.',
        ),
      );
    }

    requestAnimationFrame(() => {
      this.errorBanner?.nativeElement.focus();
    });
  }

}