export type FactorId = 'terrain' | 'temporal' | 'observer' | 'semantics' | 'domain' | 'stochastic';
export type AuditMetric = 'sun' | 'earth' | 'simultaneous';
export interface Evidence<T = number> {
  value: T;
  original: string;
  unit: string;
  source: { sourceId: string; field: string; row?: number; pointer?: string };
}
export interface Measurement {
  id: string;
  days: number;
  duration: Evidence;
  start: Evidence<string>;
  end: Evidence<string>;
  leftCensored: Evidence<boolean>;
  rightCensored: Evidence<boolean>;
}
export interface Comparison {
  id: string;
  factor: FactorId;
  scope: string;
  variant: string;
  label: string;
  beforeLabel: string;
  afterLabel: string;
  badge: string;
  kind: string;
  observer?: string;
  domain?: string;
  values: Record<AuditMetric, { before: string; after: string; deltaDays: number }>;
  deltaDefinition: string;
}
export interface FactorScope {
  id: string;
  site: string;
  experiment: string;
  coordinates: string;
  domain: string;
  observer: string;
  semantics: string;
  held: string[];
  changed: string;
  qualification: string;
}
export interface FactorRecord {
  schema: 'resolve.factors.site.v1';
  site: string;
  comparisons: Comparison[];
  measurements: Record<string, Measurement>;
  scopes: Record<string, FactorScope>;
}
export interface FactorManifest {
  schema: 'resolve.factors.v1';
  factors: { id: FactorId; label: string; kind: string; description: string }[];
  metrics: { id: AuditMetric; label: string }[];
  models: { id: string; label: string }[];
  sites: {
    id: string;
    href: string;
    sha256: string;
    bytes: number;
    comparisons: number;
    coverage: Record<FactorId, number>;
  }[];
  sources: Record<string, { path: string; sha256: string; bytes: number; href?: string }>;
  unassessed: Record<string, Partial<Record<FactorId, string>>>;
  limitations: string[];
}
export interface FactorSelection {
  site: string;
  factor: FactorId;
  metric: AuditMetric;
  observer: string;
  domain: string;
  variant: string;
}
export function applicableControls(site: string, factor: FactorId) {
  const c = site === 'dGR101' && ['terrain', 'temporal', 'observer', 'domain'].includes(factor);
  return { observer: c && factor !== 'observer', domain: c && factor !== 'domain' };
}
export function matchingComparisons(record: FactorRecord, selection: FactorSelection) {
  const active = applicableControls(selection.site, selection.factor);
  return record.comparisons.filter(
    (c) =>
      c.factor === selection.factor &&
      (!active.observer || c.observer === selection.observer) &&
      (!active.domain || c.domain === selection.domain),
  );
}
export function formatEffect(days: number) {
  if (days === 0) return '0 s';
  const sign = days > 0 ? '+' : '−',
    n = Math.abs(days);
  if (n >= 1) return `${sign}${n.toFixed(2)} d`;
  if (n * 24 >= 1) return `${sign}${(n * 24).toFixed(2)} h`;
  if (n * 1440 >= 1) return `${sign}${(n * 1440).toFixed(2)} min`;
  if (n * 86400 >= 1) return `${sign}${(n * 86400).toFixed(2)} s`;
  return `${sign}${n * 86400000 < 0.001 ? '<0.001' : (n * 86400000).toFixed(3)} ms`;
}
