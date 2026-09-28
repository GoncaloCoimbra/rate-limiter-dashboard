import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isCurrentUserRequest = request.url.endsWith('/api/auth/me');
  return next(request.clone({ withCredentials: true })).pipe(catchError(error => {
    if (error.status === 401 && !request.url.endsWith('/api/auth/login') && !request.url.endsWith('/api/auth/logout') && !isCurrentUserRequest) {
      auth.logout();
      void router.navigate(['/login']);
    } else if (error.status === 403 && !isCurrentUserRequest) {
      void router.navigate(['/forbidden']);
    }
    return throwError(() => error);
  }));
};