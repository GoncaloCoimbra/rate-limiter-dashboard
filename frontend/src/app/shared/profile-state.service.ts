import { AuthService, type AuthUser } from '../auth/auth.service';
import { effect, inject, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProfileStateService {
  private readonly auth = inject(AuthService);
  readonly name = signal('');
  readonly email = signal('');
  readonly photo = signal<string | null>(localStorage.getItem('profile-photo'));

  constructor() {
    effect(() => {
      const user = this.auth.user();
      this.syncFromUser(user);
    });

    this.name.set('');
    this.email.set('');
    this.photo.set(localStorage.getItem('profile-photo'));
  }

  syncFromUser(user: AuthUser | null): void {
    if (user) {
      this.name.set(user.name || user.username || '');
      this.email.set(user.email || '');
      return;
    }

    this.name.set('');
    this.email.set('');
  }

  update(name: string, email: string): void {
    this.name.set(name);
    this.email.set(email);
    localStorage.setItem('profile-name', name);
    localStorage.setItem('profile-email', email);
  }

  updatePhoto(photo: string): void {
    this.photo.set(photo);
    localStorage.setItem('profile-photo', photo);
  }
}
