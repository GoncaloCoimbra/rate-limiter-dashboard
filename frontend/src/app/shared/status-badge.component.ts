import { Component, input } from '@angular/core';

@Component({ selector: 'app-status-badge', standalone: true, template: `<span class="badge" [class]="tone()">{{ label() }}</span>`, styles: [`.badge{display:inline-block;border-radius:4px;padding:4px 7px;font-size:10px;font-weight:700}.good{color:#5ed9bf;background:#14342f}.warn{color:var(--orange);background:#3a2c1b}.bad{color:var(--red);background:#3b2028}.neutral{color:var(--muted);background:#252c33}`] })
export class StatusBadgeComponent { label = input(''); tone = input('neutral'); }
