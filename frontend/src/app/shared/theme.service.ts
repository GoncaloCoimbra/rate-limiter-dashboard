import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly isLight = signal(false);

  setLight(light: boolean): void {
    this.isLight.set(light);
    this.document.body.classList.toggle('light-theme', light);
  }

  toggle(): void { this.setLight(!this.isLight()); }
}
