import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Bell, LucideAngularModule, Moon, Sun } from 'lucide-angular';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { TranslationService } from '../shared/translation.service';
import { ThemeService } from '../shared/theme.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <header class="topbar">
      <div class="breadcrumbs"><span>{{ i18n.translate('workspace') }}</span><b>›</b><strong>{{ i18n.translate(currentPage()) }}</strong></div>
      <div class="top-actions">
        <label class="search">⌕<input [placeholder]="i18n.translate('search')" /><kbd>⌘ K</kbd></label>
        <select class="locale" [value]="i18n.locale()" (change)="changeLocale($any($event.target).value)"><option value="pt">🇵🇹 PT ▾</option><option value="en">🇬🇧 EN ▾</option><option value="zh">🇨🇳 中文 ▾</option></select>
        <div class="notification-wrap">
          <button class="icon-button" aria-label="Notificações" (click)="toggleNotifications()"><lucide-icon [img]="Bell" size="18" /><em></em></button>
          <div class="notification-panel" *ngIf="notificationsOpen()">
            <div class="notification-header"><strong>Notificações <span>{{ unreadCount() }}</span></strong><button (click)="markAllRead()">Marcar todas como lidas</button></div>
            <div class="notification" [class.read]="notification.read" *ngFor="let notification of notifications"><i [style.background]="notification.read ? 'var(--muted)' : notification.color"></i><div><strong>{{ notification.title }}</strong><small>{{ notification.description }}</small></div><button class="dismiss" aria-label="Fechar notificação" (click)="dismissNotification(notification.id)">×</button></div>
            <button class="load-more" (click)="loadMoreNotifications()">Carregar mais</button>
          </div>
        </div>
        <button class="icon-button" aria-label="Alternar tema" (click)="toggleTheme()"><lucide-icon [img]="isLight() ? Moon : Sun" size="18" /></button>
      </div>
    </header>
  `,
  styles: [`
    :host{display:block}.topbar{height:92px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:0 38px}.breadcrumbs{display:flex;align-items:center;gap:14px;color:var(--muted);font-size:13px}.breadcrumbs b{font-size:20px;color:#55636b}.breadcrumbs strong{color:var(--text)}.top-actions{display:flex;align-items:center;gap:12px}.search{height:40px;width:280px;border:1px solid var(--border);background:var(--card);border-radius:8px;display:flex;align-items:center;gap:9px;padding:0 11px;color:var(--muted)}.search input{min-width:0;flex:1;border:0;outline:0;background:none;color:var(--text);font-size:13px}.search kbd{border:1px solid #33404a;border-radius:4px;padding:2px 5px;font-size:10px;color:var(--muted)}.locale,.icon-button{border:1px solid var(--border);background:var(--card);color:var(--text);border-radius:8px;height:40px;padding:0 12px}.icon-button{width:40px;padding:0;font-size:19px;position:relative}.icon-button em{position:absolute;width:6px;height:6px;background:var(--red);border-radius:50%;top:7px;right:8px}.notification-wrap{position:relative}.notification-panel{position:absolute;right:0;top:49px;width:340px;padding:14px;background:var(--card);border:1px solid var(--border);border-radius:10px;box-shadow:0 18px 40px #0008;z-index:10}.notification-header{display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:1px solid var(--border)}.notification-header span{background:var(--red);color:#fff;border-radius:10px;padding:2px 6px;font-size:10px}.notification-header button,.load-more{border:0;background:none;color:var(--cyan);font-size:11px}.notification{display:flex;gap:10px;padding:12px 0;border-bottom:1px solid var(--border)}.notification>i{width:8px;height:8px;border-radius:50%;margin-top:5px;flex:none}.notification div{display:grid;gap:4px}.notification strong{font-size:12px}.notification small{color:var(--muted);font-size:10px;line-height:1.4}.load-more{display:block;margin:12px auto 0}@media(max-width:900px){.topbar{padding:0 20px}.search{width:220px}}@media(max-width:600px){.topbar{height:72px}.breadcrumbs span,.breadcrumbs b,.search,.locale{display:none}.top-actions{margin-left:auto}.notification-panel{position:fixed;top:70px;right:12px;left:12px;width:auto}}
  `]
})
export class TopbarComponent {
  readonly i18n = inject(TranslationService);
  readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  readonly Bell = Bell;
  readonly Sun = Sun;
  readonly Moon = Moon;
  readonly notificationsOpen = signal(false);
  readonly isLight = this.theme.isLight;
  notifications = [
    { id: 1, title: 'Taxa limite excedida', description: 'A política Authentication bloqueou pedidos.', color: 'var(--red)', read: false },
    { id: 2, title: 'Política atualizada', description: 'A Premium API foi atualizada recentemente.', color: 'var(--cyan)', read: false },
    { id: 3, title: 'Utilização elevada', description: 'A utilização média está a aproximar-se do limite.', color: 'var(--orange)', read: false },
    { id: 4, title: 'Endpoint sob pressão', description: 'Um endpoint está perto do limite configurado.', color: 'var(--purple)', read: false }
  ];
  readonly currentPage = signal('dashboard');

  constructor() {
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe((event) => {
      const route = event.urlAfterRedirects.split('/')[1] || '';
      this.currentPage.set({ policies: 'policies', endpoints: 'endpoints', keys: 'keys', clients: 'clients', logs: 'logs', metrics: 'metrics', alerts: 'alerts', settings: 'settings', exports: 'exports', events: 'events', simulator: 'simulator', limits: 'rateLimits', perfil: 'profile' }[route] || 'dashboard');
    });
  }

  toggleNotifications(): void {
    this.notificationsOpen.update((open) => !open);
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  changeLocale(locale: 'pt' | 'en' | 'zh'): void { this.i18n.setLocale(locale); }
  unreadCount(): number { return this.notifications.filter((notification) => !notification.read).length; }
  markAllRead(): void { this.notifications.forEach((notification) => notification.read = true); }
  dismissNotification(id: number): void { this.notifications = this.notifications.filter((notification) => notification.id !== id); }
  loadMoreNotifications(): void {
    const nextId = this.notifications.length + 1;
    this.notifications = [...this.notifications, { id: nextId, title: 'Sincronização concluída', description: 'Os dados do workspace foram atualizados.', color: 'var(--cyan)', read: false }];
  }
}
