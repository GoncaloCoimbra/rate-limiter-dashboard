import { Component, input } from '@angular/core';

@Component({ selector: 'app-sparkline', standalone: true, template: `<svg viewBox="0 0 110 30" preserveAspectRatio="none"><polyline [attr.points]="points()" fill="none" [attr.stroke]="color()" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /></svg>`, styles: [`:host{position:absolute;left:16px;right:16px;bottom:14px;height:25px}svg{width:100%;height:100%}`] })
export class SparklineComponent { color = input('var(--cyan)'); points = input('0,20 30,8 60,15 90,4 110,10'); }
