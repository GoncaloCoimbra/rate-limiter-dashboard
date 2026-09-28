import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';

interface LoginResponse { message: string; }
export interface AuthUser { id: number; username: string; name: string; email: string; roles: string[]; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  readonly user = signal<AuthUser | null>(null);

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', { username, password }, { withCredentials: true }).pipe(
      switchMap(response => this.http.get<AuthUser>('/api/auth/me', { withCredentials: true }).pipe(
        tap(user => this.user.set(user)),
        map(() => response),
        catchError(error => {
          this.user.set(null);
          return throwError(() => error);
        })
      ))
    );
  }

  register(name: string, email: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/auth/register', { name, email, password });
  }

  requestPasswordReset(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/auth/forgot-password', { email });
  }

  loadCurrentUser(): Observable<AuthUser | null> {
    return this.http.get<AuthUser>('/api/auth/me', { withCredentials: true }).pipe(
      tap(user => this.user.set(user)),
      catchError(() => {
        this.user.set(null);
        return of(null);
      })
    );
  }

  logout(): void { this.user.set(null); this.http.post('/api/auth/logout', {}, { withCredentials: true }).subscribe(); }
}