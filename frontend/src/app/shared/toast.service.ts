import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly message = signal('');
  private timeoutId?: number;
  show(message: string): void {
    this.message.set(message);
    window.clearTimeout(this.timeoutId);
    this.timeoutId = window.setTimeout(() => this.message.set(''), 2200);
  }
}
