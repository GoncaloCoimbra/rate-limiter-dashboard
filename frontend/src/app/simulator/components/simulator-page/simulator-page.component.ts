import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SimulatorService, SimulatorResult } from '../../services/simulator.service';

@Component({
  selector: 'app-simulator-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section>
      <h2>Simulador</h2>
      <p>Teste o comportamento de uma política sob pressão de tráfego.</p>

      <div class="controls">
        <label>
          ID da política
          <input type="number" [(ngModel)]="policyId" min="1" />
        </label>
        <label>
          Utilização atual
          <input type="number" [(ngModel)]="usage" min="0" />
        </label>
        <button type="button" (click)="simulate()">Verificar</button>
      </div>

      <p class="error" *ngIf="error">{{ error }}</p>
      <div class="result" *ngIf="result">
        <p><strong>Estado:</strong> {{ result.allowed ? 'Permitido' : 'Bloqueado' }}</p>
        <p><strong>Restante:</strong> {{ result.remaining }}</p>
        <p><strong>Tentar novamente depois de:</strong> {{ result.retryAfter }}s</p>
      </div>
    </section>
  `,
  styles: [
    `
      section { display: grid; gap: 1rem; }
      .controls { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
      label { display: grid; gap: 0.35rem; color: #bfdbfe; }
      input { padding: 0.7rem 0.8rem; border-radius: 10px; border: 1px solid rgba(148,163,184,0.25); background: rgba(15,23,42,0.4); color: white; }
      button { align-self: end; padding: 0.8rem 1rem; border: none; border-radius: 10px; background: #3b82f6; color: white; font-weight: 600; }
      .result { display: grid; gap: 0.4rem; background: rgba(15,23,42,0.35); padding: 1rem; border-radius: 12px; border: 1px solid rgba(148,163,184,0.2); }
    `
  ]
})
export class SimulatorPageComponent {
  private readonly simulatorService = inject(SimulatorService);
  policyId = 1;
  usage = 75;
  result: SimulatorResult | null = null;
  error: string | null = null;

  simulate(): void {
    this.error = null;
    this.simulatorService.evaluate(this.policyId).subscribe({
      next: result => this.result = result,
      error: () => this.error = 'Não foi possível contactar o rate limiter.'
    });
  }
}
