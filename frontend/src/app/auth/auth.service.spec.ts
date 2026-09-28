import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { AuthService, type AuthUser } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should not expose a demo auth bypass', () => {
    expect((service as any).startDemo).toBeUndefined();
    expect((service as any).isDemo).toBeUndefined();
    expect((service as any).demoKey).toBeUndefined();
  });

  it('loads authentication from the HttpOnly cookie session', () => {
    const result: { user: AuthUser | null } = { user: null };
    service.loadCurrentUser().subscribe(user => result.user = user);

    const request = http.expectOne('/api/auth/me');
    expect(request.request.withCredentials).toBeTrue();
    request.flush({ id: 1, username: 'admin', name: 'Admin', email: 'admin@example.com', roles: ['ADMIN'] });

    expect(result.user).toEqual({ id: 1, username: 'admin', name: 'Admin', email: 'admin@example.com', roles: ['ADMIN'] });
    expect(service.user()).toEqual(result.user);
    expect(service.user()).not.toBeNull();
  });

  it('does not authenticate when the cookie session is rejected', () => {
    let authenticatedUser: unknown = undefined;
    service.loadCurrentUser().subscribe(user => authenticatedUser = user);

    http.expectOne('/api/auth/me').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authenticatedUser).toBeNull();
    expect(service.user()).toBeNull();
  });

  it('loads the user after login using the returned cookie', () => {
    let response: unknown;
    service.login('admin', 'password').subscribe(value => response = value);

    http.expectOne('/api/auth/login').flush({ message: 'Authenticated' });
    const userRequest = http.expectOne('/api/auth/me');
    expect(userRequest.request.withCredentials).toBeTrue();
    userRequest.flush({ id: 1, username: 'admin', name: 'Admin', email: 'admin@example.com', roles: ['ADMIN'] });

    expect(response).toEqual({ message: 'Authenticated' });
    expect(service.user()).not.toBeNull();
  });
});
