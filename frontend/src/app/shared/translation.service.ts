import { Injectable, signal } from '@angular/core';

export type Locale = 'pt' | 'en' | 'zh';
type Dictionary = Record<string, string>;

const pt: Dictionary = { overview: 'VISÃO GERAL', traffic: 'CONTROLO DE TRÁFEGO', observability: 'OBSERVABILIDADE', workspace: 'WORKSPACE', dashboard: 'Dashboard', rateLimits: 'Rate limits', policies: 'Políticas', endpoints: 'Endpoints', keys: 'API keys', clients: 'Clientes', logs: 'Logs', metrics: 'Métricas', alerts: 'Alertas', settings: 'Definições', exports: 'Histórico de exportações', events: 'Eventos', simulator: 'Simulador', production: 'Produção', search: 'Pesquisar tudo...', greeting: 'BOM DIA', overviewTitle: 'Visão geral do sistema', overviewDescription: 'Uma visão em tempo real do tráfego da API e da proteção de rate limiting.', createPolicy: 'Criar política', dateRange: 'Intervalo de datas', compare: 'Comparar com período anterior', connect: 'Ligar workspace', requests: 'Pedidos', allowed: 'Permitidos', blocked: 'Bloqueados', blockRate: 'Taxa de bloqueio', activePolicies: 'Políticas ativas', eventsTracked: 'Eventos monitorizados', calculatedEvents: 'calculado a partir dos eventos', policiesProduction: 'políticas em produção', eventsProcessed: 'eventos processados', profile: 'Perfil', logout: 'Sair' };
const en: Dictionary = { overview: 'OVERVIEW', traffic: 'TRAFFIC CONTROL', observability: 'OBSERVABILITY', workspace: 'WORKSPACE', dashboard: 'Dashboard', rateLimits: 'Rate limits', policies: 'Policies', endpoints: 'Endpoints', keys: 'API keys', clients: 'Clients', logs: 'Logs', metrics: 'Metrics', alerts: 'Alerts', settings: 'Settings', exports: 'Export history', events: 'Events', simulator: 'Simulator', production: 'Production', search: 'Search anything...', greeting: 'GOOD MORNING', overviewTitle: 'System overview', overviewDescription: 'A live view of API traffic and rate-limit protection.', createPolicy: 'Create policy', dateRange: 'Date range', compare: 'Compare previous period', connect: 'Connect workspace', requests: 'Requests', allowed: 'Allowed', blocked: 'Blocked', blockRate: 'Block rate', activePolicies: 'Active policies', eventsTracked: 'Events tracked', calculatedEvents: 'calculated from events', policiesProduction: 'policies in production', eventsProcessed: 'events processed', profile: 'Profile', logout: 'Sign out' };
const zh: Dictionary = { overview: '概览', traffic: '流量控制', observability: '可观测性', workspace: '工作区', dashboard: '仪表板', rateLimits: '速率限制', policies: '策略', endpoints: '端点', keys: 'API 密钥', clients: '客户端', logs: '日志', metrics: '指标', alerts: '警报', settings: '设置', exports: '导出历史', events: '事件', simulator: '模拟器', production: '生产环境', search: '搜索全部...', greeting: '早上好', overviewTitle: '系统概览', overviewDescription: '实时查看 API 流量和速率限制保护。', createPolicy: '创建策略', dateRange: '日期范围', compare: '与上一周期比较', connect: '连接工作区', requests: '请求', allowed: '已允许', blocked: '已阻止', blockRate: '阻止率', activePolicies: '有效策略', eventsTracked: '已监控事件', calculatedEvents: '根据事件计算', policiesProduction: '生产中的策略', eventsProcessed: '已处理事件', profile: '个人资料', logout: '退出' };

@Injectable({ providedIn: 'root' })
export class TranslationService {
  readonly locale = signal<Locale>((localStorage.getItem('locale') as Locale) || 'pt');
  translate(key: string): string {
    const dictionary = ({ pt, en, zh }[this.locale()]);
    const aliases: Record<Locale, Record<string, string>> = {
      pt: { apiKeys: 'API keys', exportHistory: 'Histórico de exportações', systemOverview: 'Visão geral do sistema', activePolicies: 'Políticas ativas', eventsTracked: 'Eventos monitorizados' },
      en: { apiKeys: 'API keys', exportHistory: 'Export history', systemOverview: 'System overview', activePolicies: 'Active policies', eventsTracked: 'Events tracked' },
      zh: { apiKeys: 'API密钥', exportHistory: '导出历史', systemOverview: '系统概览', activePolicies: '活跃策略', eventsTracked: '追踪事件' }
    };
    return aliases[this.locale()][key] || dictionary[key] || key;
  }
  setLocale(locale: Locale): void { localStorage.setItem('locale', locale); this.locale.set(locale); }
}
