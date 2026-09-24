import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();
  const authenticatedRequest = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authenticatedRequest).pipe(catchError(error => {
    if (error.status === 401 && !auth.isDemo() && !request.url.endsWith('/api/auth/login')) {
      auth.logout();
      void router.navigate(['/login']);
    } else if (error.status === 403) {
      void router.navigate(['/forbidden']);
    }
    return throwError(() => error);
  }));
};