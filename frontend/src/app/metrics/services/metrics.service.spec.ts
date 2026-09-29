import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(MetricsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests the summary for the selected interval', () => {
    service.summary(1000, 2000).subscribe();

    const request = http.expectOne('/api/metrics/summary?from=1000&to=2000');
    expect(request.request.method).toBe('GET');
    request.flush({ allowedRequests: 8, blockedRequests: 2, averageRate: 80, totalPolicies: 1 });
  });

  it('requests a comparison using both adjacent intervals', () => {
    service.comparison(2000, 3000, 1000, 2000).subscribe();

    const request = http.expectOne('/api/metrics/comparison?from=2000&to=3000&previousFrom=1000&previousTo=2000');
    expect(request.request.method).toBe('GET');
    request.flush({ current: {}, previous: {}, delta: 10 });
  });

  it('requests traffic buckets for the selected interval', () => {
    service.trafficSeries(1000, 2000).subscribe();

    const request = http.expectOne('/api/metrics/series?from=1000&to=2000');
    expect(request.request.method).toBe('GET');
    request.flush([{ bucketStart: 1000, allowedRequests: 8, blockedRequests: 2 }]);
  });

  it('requests bounded endpoint activity for the selected interval', () => {
    service.endpointActivity(1000, 2000, 5).subscribe();

    const request = http.expectOne('/api/metrics/endpoints?from=1000&to=2000&limit=5');
    expect(request.request.method).toBe('GET');
    request.flush([{ endpoint: 'GET /api/public/ping', requestCount: 10, blockedRequests: 2 }]);
  });
});