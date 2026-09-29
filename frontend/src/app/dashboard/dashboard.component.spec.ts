import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.setItem('locale', 'pt');
    await TestBed.configureTestingModule({
      imports: [DashboardComponent, HttpClientTestingModule],
      providers: [provideRouter([])]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('renders real summary, traffic buckets and endpoint aggregates', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    flushDashboardRequests();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('10');
    expect(text).toContain('GET /api/public/ping');
    expect(fixture.nativeElement.querySelector('.traffic-bar.allowed')?.getAttribute('title')).toBe('8 pedidos permitidos');
    expect(fixture.nativeElement.querySelector('.traffic-chart')).not.toBeNull();

    fixture.componentInstance.i18n.setLocale('en');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Requests over time');
    expect(fixture.nativeElement.querySelector('.traffic-bar.allowed')?.getAttribute('title')).toBe('8 requests allowed');

    fixture.componentInstance.i18n.setLocale('zh');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('请求趋势');
    expect(fixture.nativeElement.querySelector('.traffic-bar.allowed')?.getAttribute('title')).toBe('已允许 8 个请求');
  });

  it('queries the selected six-hour range and loads comparison on demand', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    flushDashboardRequests();

    const rangeButton = fixture.nativeElement.querySelector('.range-dropdown > button') as HTMLButtonElement;
    rangeButton.click();
    fixture.detectChanges();
    const sixHourOption = Array.from(fixture.nativeElement.querySelectorAll('[role="menuitemradio"]'))
      .find((button) => (button as HTMLElement).textContent?.includes('Últimas 6 horas')) as HTMLButtonElement;
    sixHourOption.click();

    const summaryRequest = http.expectOne((request) => request.url === '/api/metrics/summary');
    const from = Number(summaryRequest.request.params.get('from'));
    const to = Number(summaryRequest.request.params.get('to'));
    expect(to - from).toBeCloseTo(6 * 60 * 60 * 1000, -4);
    summaryRequest.flush({ allowedRequests: 8, blockedRequests: 2, averageRate: 80, totalPolicies: 1 });
    flushRemainderRequests();

    const comparisonSwitch = fixture.nativeElement.querySelector('.compare-toggle') as HTMLButtonElement;
    comparisonSwitch.click();
    const comparisonRequest = http.expectOne((request) => request.url === '/api/metrics/comparison');
    expect(comparisonRequest.request.params.get('previousTo')).toBe(comparisonRequest.request.params.get('from'));
    expect(Number(comparisonRequest.request.params.get('previousFrom'))).toBeLessThan(from);
    comparisonRequest.flush({ current: { allowedRequests: 8, blockedRequests: 2, averageRate: 80, totalPolicies: 1 }, previous: { allowedRequests: 7, blockedRequests: 3, averageRate: 70, totalPolicies: 1 }, delta: 10 });
    http.expectOne((request) => request.url === '/api/metrics/summary')
      .flush({ allowedRequests: 8, blockedRequests: 2, averageRate: 80, totalPolicies: 1 });
    flushRemainderRequests();
  });

  function flushDashboardRequests(): void {
    http.expectOne((request) => request.url === '/api/metrics/summary')
      .flush({ allowedRequests: 8, blockedRequests: 2, averageRate: 80, totalPolicies: 1 });
    http.expectOne((request) => request.url === '/api/events').flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 5 });
    http.expectOne((request) => request.url === '/api/metrics/series')
      .flush([{ bucketStart: Date.now(), allowedRequests: 8, blockedRequests: 2 }]);
    http.expectOne((request) => request.url === '/api/metrics/endpoints')
      .flush([{ endpoint: 'GET /api/public/ping', requestCount: 10, blockedRequests: 2 }]);
  }

  function flushRemainderRequests(): void {
    http.expectOne((request) => request.url === '/api/events').flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 5 });
    http.expectOne((request) => request.url === '/api/metrics/series')
      .flush([{ bucketStart: Date.now(), allowedRequests: 8, blockedRequests: 2 }]);
    http.expectOne((request) => request.url === '/api/metrics/endpoints')
      .flush([{ endpoint: 'GET /api/public/ping', requestCount: 10, blockedRequests: 2 }]);
  }
});