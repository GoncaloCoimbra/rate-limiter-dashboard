import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

interface LoginResponse { token: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenKey = 'rate-limiter-jwt';
  private readonly demoKey = 'rate-limiter-demo';

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', { username, password }).pipe(
      tap(response => sessionStorage.setItem(this.tokenKey, response.token))
    );
  }

  register(name: string, email: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/auth/register', { name, email, password });
  }

  requestPasswordReset(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/auth/forgot-password', { email });
  }

  startDemo(): void { sessionStorage.setItem(this.demoKey, 'true'); }
  logout(): void { sessionStorage.removeItem(this.tokenKey); sessionStorage.removeItem(this.demoKey); }
  token(): string | null { return sessionStorage.getItem(this.tokenKey); }
  isDemo(): boolean { return sessionStorage.getItem(this.demoKey) === 'true'; }
  isAuthenticated(): boolean { return !!this.token() || this.isDemo(); }
}