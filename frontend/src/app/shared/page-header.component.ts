import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({ selector: 'app-page-header', standalone: true, imports: [CommonModule, RouterLink], template: `<header class="page-header"><div><p>{{ eyebrow() }}</p><h1>{{ title() }}</h1><span>{{ description() }}</span></div><a *ngIf="actionLabel()" [routerLink]="actionLink()">＋ {{ actionLabel() }}</a></header>`, styles: [`.page-header{display:flex;justify-content:space-between;align-items:end;gap:24px;margin-bottom:20px}.page-header p{color:var(--cyan);font-size:10px;font-weight:700;letter-spacing:.16em;margin:0 0 8px}.page-header h1{font:500 32px 'Space Grotesk';margin:0}.page-header span{display:block;color:var(--muted);font-size:13px;margin-top:8px}.page-header a{background:var(--cyan);border-radius:7px;color:#082328;font-weight:700;padding:12px 16px;text-decoration:none;white-space:nowrap}@media(max-width:650px){.page-header{align-items:start;flex-direction:column}}`] })
export class PageHeaderComponent { eyebrow = input('WORKSPACE'); title = input(''); description = input(''); actionLabel = input(''); actionLink = input('/'); }
