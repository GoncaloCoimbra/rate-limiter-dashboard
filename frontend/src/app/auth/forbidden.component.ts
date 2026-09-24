import { Component } from '@angular/core';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  template: '<main><h1>Acesso negado</h1><p>Não tem permissões para aceder a este recurso.</p></main>',
  styles: ['main { min-height: 100vh; display: grid; place-content: center; gap: .5rem; background: #0b1220; color: white; text-align: center; }']
})
export class ForbiddenComponent {}