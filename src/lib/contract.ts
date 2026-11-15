export type Observer = 'fixed_absolute' | 'each_surface_2m';
export type Domain = 'registered_domain' | 'uncensored_intersecting_registered';
export interface SourceRef {
  sourceId: string;
  field: string;
  row?: number;
  pointer?: string;
  line?: number;
}
export interface SourceInfo {
  path: string;
  sha256: string;
  bytes: number;
  experiment: string;
  href?: string;
}
export interface Datum<T = number> {
  value: T;
  original: string;
  unit: string;
  source: SourceRef;
}
export interface Interval {
  days: Datum;
  start: Datum<string>;
  end: Datum<string>;
  leftCensored: Datum<boolean>;
  rightCensored: Datum<boolean>;
}
export interface AuditCase {
  id: string;
  observer: Observer;
  domain: Domain;
  simultaneous: Interval;
  sun: Interval;
  earth: Interval;
  timeline: { sun: Interval; earth: Interval };
  delta: Datum;
  ground: Datum;
  aboveGround: Datum;
  absoluteHeight: Datum;
  nominalHorizon: Datum;
  onsetAzimuth: Datum;
}
export interface Representation {
  id: string;
  label: string;
  type: 'native-lola' | 'separate-sdem' | 'synthetic-control';
  product: Datum<string>;
  spacing: Datum;
  sourceRaster: string;
  rasterSha256: string | null;
  description: string;
  nasaUrl: string | null;
  source: SourceRef;
}
export interface Witness {
  id: string;
  observer: Observer;
  diagnostic: 'own_late_solar_onset' | 'nominal5m_late_solar_onset_time';
  time_utc: Datum<string>;
  target_azimuth_deg: Datum;
  target_elevation_deg: Datum;
  interpolated_horizon_deg: Datum;
  surface_range_m: Datum;
  azimuth_deg: Datum;
  horizon_elevation_deg: Datum;
  witness_height_m: Datum;
  source_row: Datum;
  source_col: Datum;
}
export interface AuditData {
  schema: 'resolve.audit.v1';
  experiment: string;
  site: string;
  year: string;
  region: string;
  observable: string;
  semantics: string;
  classification: string;
  classificationScope: string;
  defaults: { id: string; comparison: string; observer: Observer; domain: Domain };
  geometry: {
    latitude: Datum;
    longitude: Datum;
    radius: Datum;
    frame: string;
    translation: string;
    aberration: string;
  };
  domains: Record<Domain, { label: string; description: string }>;
  representations: Representation[];
  cases: Record<string, AuditCase>;
  witnesses: Witness[];
  support: {
    id: string;
    label: string;
    digits: number;
    datum: Datum;
    sampling: string;
    sourceRaster: string;
  }[];
  profileFiles: Record<string, { url: string; source: SourceRef; units: string[]; count: number }>;
  sectionFiles: Record<string, { url: string; units: string[] }>;
  sources: Record<string, SourceInfo>;
  limitations: string[];
  links: { label: string; url: string }[];
  reportedComparisons: {
    sdemGroundOffset: Datum;
    alignedRange: Datum;
    aligned80Minus5Height: Datum;
  };
  plotDomains: {
    azimuth: [number, number];
    elevation: [number, number];
    unit: string;
    purpose: string;
  };
}
export interface Skyline {
  schema: 'resolve.skyline.v1';
  id: string;
  observer: Observer;
  source: SourceRef;
  rays: [number, number, number][];
}
export interface Section {
  direction: string;
  azimuth: Datum;
  source: SourceRef;
  samples: [number, number, number][];
}
export interface TerrainSections {
  schema: 'resolve.sections.v1';
  id: string;
  sections: Section[];
}
export const caseKey = (id: string, observer: Observer, domain: Domain) =>
  `${id}:${observer}:${domain}`;
