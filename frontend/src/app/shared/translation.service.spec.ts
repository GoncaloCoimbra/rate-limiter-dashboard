import { TranslationService, type Locale } from './translation.service';

describe('TranslationService', () => {
  const requiredUiKeys = [
    'dashboard', 'overviewTitle', 'overviewDescription', 'createPolicy', 'dateRange', 'compare',
    'loadingMetrics', 'loadingMetricsHint', 'metricsErrorTitle', 'retry', 'noEventsTitle',
    'lastHour', 'lastSixHours', 'today', 'trafficOverTime', 'seriesAllowed', 'seriesBlocked',
    'noTraffic', 'decisionsPeriod', 'decisionDistribution', 'refreshMetrics', 'topEndpoints',
    'recentEvents', 'eventBlocked', 'eventAllowed', 'notifications', 'searchPlaceholder',
    'loadingData', 'errorLoadingData', 'emptyResults', 'policyHeading', 'policyDescription',
    'createPolicyDialog', 'algorithm', 'requestLimit', 'password', 'email', 'signIn'
  ];

  beforeEach(() => localStorage.removeItem('locale'));

  it('has a translation for every shared screen key in every supported locale', () => {
    const service = new TranslationService();

    for (const locale of ['pt', 'en', 'zh'] satisfies Locale[]) {
      service.setLocale(locale);
      for (const key of requiredUiKeys) {
        expect(service.translate(key)).withContext(`${locale}:${key}`).not.toBe(key);
      }
    }
  });

  it('persists a supported locale and keeps unknown text readable', () => {
    const service = new TranslationService();
    service.setLocale('en');

    expect(localStorage.getItem('locale')).toBe('en');
    expect(service.translate('unmapped user copy')).toBe('unmapped user copy');
  });

  it('falls back to Portuguese for an unsupported stored locale', () => {
    localStorage.setItem('locale', 'fr');
    const service = new TranslationService();

    expect(service.locale()).toBe('pt');
    expect(service.translate('overviewTitle')).toBe('Visão geral do sistema');
  });
});