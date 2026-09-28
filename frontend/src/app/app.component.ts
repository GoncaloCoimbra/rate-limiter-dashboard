import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { SidebarComponent } from './shell/sidebar.component';
import { TopbarComponent } from './shell/topbar.component';
import { CommonModule } from '@angular/common';
import { ToastService } from './shared/toast.service';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterLink, RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  readonly authRoute = signal(false);
  title = 'Rate Limiter Dashboard';

  constructor(router: Router) {
    this.auth.loadCurrentUser().subscribe();
    const updateLayout = (url: string) => this.authRoute.set(/^\/(login|criar-conta|recuperar-password|forbidden)/.test(url));
    updateLayout(router.url);
    router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe((event) => updateLayout(event.urlAfterRedirects));
  }
}
