import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from './auth/auth.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    const authServiceSpy = {
      loadCurrentUser: jasmine.createSpy('loadCurrentUser').and.returnValue(of(null)),
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false),
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should initialize the app shell with a real dashboard title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toBe('Rate Limiter Dashboard');
  });

  it('should keep non-auth routes outside the protected app shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.authRoute()).toBeFalse();
  });
});
