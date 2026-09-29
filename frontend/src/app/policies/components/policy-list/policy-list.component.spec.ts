import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PolicyListComponent } from './policy-list.component';

const policy = {
  id: 17,
  name: 'Burst protection',
  algorithm: 'TOKEN_BUCKET',
  limit: 25,
  window: 'MINUTE',
  scope: 'API_KEY',
  status: 'ACTIVE'
};

describe('PolicyListComponent', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.setItem('locale', 'en');
    await TestBed.configureTestingModule({
      imports: [PolicyListComponent, HttpClientTestingModule]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses server counts, filters policies and updates an edited policy', () => {
    const fixture = TestBed.createComponent(PolicyListComponent);
    fixture.detectChanges();

    http.expectOne('/api/policies?page=0&size=10').flush({
      content: [policy, { ...policy, id: 18, name: 'Paused policy', status: 'PAUSED' }],
      totalElements: 2,
      totalPages: 1,
      number: 0,
      size: 10
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Active on this page');
    expect(fixture.nativeElement.textContent).toContain('Paused on this page');
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(2);

    fixture.componentInstance.searchTerm = 'burst';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(1);

    fixture.componentInstance.editPolicy(fixture.componentInstance.policies[0]);
    fixture.detectChanges();
    const nameInput = fixture.nativeElement.querySelector('#policy-name') as HTMLInputElement;
    expect(nameInput.value).toBe('Burst protection');
    nameInput.value = 'Burst protection updated';
    nameInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement).click();

    const update = http.expectOne('/api/policies/17');
    expect(update.request.method).toBe('PUT');
    expect(update.request.body.name).toBe('Burst protection updated');
    expect(update.request.body.window).toBe('MINUTE');
    update.flush({ ...policy, name: 'Burst protection updated' });

    http.expectOne('/api/policies?page=0&size=10').flush({
      content: [{ ...policy, name: 'Burst protection updated' }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10
    });
  });
});
