import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProfileStateService {
  readonly name = signal(localStorage.getItem('profile-name') || 'Alex Silva');
  readonly email = signal(localStorage.getItem('profile-email') || 'alex.silva@acme.com');
  readonly photo = signal(localStorage.getItem('profile-photo'));

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
