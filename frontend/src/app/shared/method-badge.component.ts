import { Component, input } from '@angular/core';

@Component({ selector: 'app-method-badge', standalone: true, template: `<span class="method" [class]="method().toLowerCase()">{{ method() }}</span>`, styles: [`.method{display:inline-block;border-radius:4px;padding:4px 6px;font-size:9px;font-weight:700}.get{color:var(--cyan);background:#143337}.post{color:var(--purple);background:#28213e}.put{color:var(--orange);background:#3a2c1b}.delete{color:var(--red);background:#3b2028}`] })
export class MethodBadgeComponent { method = input('GET'); }
