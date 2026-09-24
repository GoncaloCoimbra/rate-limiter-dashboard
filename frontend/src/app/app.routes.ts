import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ENDPOINTS_ROUTES } from './endpoints/endpoints.routes';
import { LOGS_ROUTES } from './logs/logs.routes';
import { ALERTS_ROUTES } from './alerts/alerts.routes';
import { KEYS_ROUTES } from './keys/keys.routes';
import { CLIENTS_ROUTES } from './clients/clients.routes';
import { SETTINGS_ROUTES } from './settings/settings.routes';
import { EXPORTS_ROUTES } from './exports/exports.routes';
import { EVENTS_ROUTES } from './events/events.routes';
import { METRICS_ROUTES } from './metrics/metrics.routes';
import { POLICIES_ROUTES } from './policies/policies.routes';
import { SIMULATOR_ROUTES } from './simulator/simulator.routes';
import { RateLimitsComponent } from './limits/rate-limits.component';
import { ProfileComponent } from './profile/profile.component';
import { DocumentationComponent } from './help/documentation.component';
import { SupportComponent } from './help/support.component';
import { LoginComponent } from './auth/login.component';
import { authGuard } from './auth/auth.guard';
import { ForbiddenComponent } from './auth/forbidden.component';
import { RegisterComponent } from './auth/register.component';
import { ForgotPasswordComponent } from './auth/forgot-password.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'criar-conta', component: RegisterComponent },
  { path: 'recuperar-password', component: ForgotPasswordComponent },
  { path: 'forbidden', component: ForbiddenComponent },
  { path: '', pathMatch: 'full', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'policies', children: POLICIES_ROUTES },
  { path: 'events', children: EVENTS_ROUTES },
  { path: 'metrics', children: METRICS_ROUTES },
  { path: 'endpoints', children: ENDPOINTS_ROUTES },
  { path: 'logs', children: LOGS_ROUTES },
  { path: 'alerts', children: ALERTS_ROUTES },
  { path: 'keys', children: KEYS_ROUTES },
  { path: 'clients', children: CLIENTS_ROUTES },
  { path: 'settings', children: SETTINGS_ROUTES },
  { path: 'exports', children: EXPORTS_ROUTES },
  { path: 'limits', component: RateLimitsComponent },
  { path: 'simulator', children: SIMULATOR_ROUTES }
  ,{ path: 'perfil', component: ProfileComponent },
  { path: 'definicoes', redirectTo: 'settings', pathMatch: 'full' },
  { path: 'documentacao', component: DocumentationComponent },
  { path: 'suporte', component: SupportComponent },
  { path: '**', redirectTo: '' }
];

for (const route of routes) {
  if (!['login', 'criar-conta', 'recuperar-password', 'forbidden'].includes(route.path ?? '') && route.redirectTo === undefined && route.canActivate === undefined) route.canActivate = [authGuard];
}
