import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent translations', () => {
  beforeEach(async () => {
    localStorage.setItem('locale', 'pt');
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { login: () => of({ message: 'Authenticated' }) } }
      ]
    }).compileComponents();
  });

  it('renders translated login copy after changing language', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Bem-vindo de volta');
    expect(fixture.nativeElement.textContent).toContain('Palavra-passe');

    fixture.componentInstance.i18n.setLocale('en');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Welcome back');
    expect(fixture.nativeElement.textContent).toContain('Password');
    expect(fixture.nativeElement.textContent).not.toContain('Palavra-passe');

    fixture.componentInstance.i18n.setLocale('zh');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('欢迎回来');
    expect(fixture.nativeElement.textContent).toContain('密码');
  });
});