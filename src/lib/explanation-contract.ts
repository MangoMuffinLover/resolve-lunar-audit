import type { Datum, TerrainSections } from './contract';
import type { FactorManifest } from './factor-contract';
export type { TerrainSections };
export interface FileRef {
  href: string;
  sha256: string;
  bytes: number;
}
export interface ModelRef extends FileRef {
  model: string;
  observer: string;
  label: string;
}
export type PhysicsSample = [
  number,
  number,
  number,
  number,
  boolean,
  number,
  number,
  number,
  number,
  boolean,
  boolean,
];
export interface WitnessRay {
  bracket: 'lower' | 'upper';
  azimuth_deg: Datum;
  horizon_elevation_deg: Datum;
  surface_range_m: Datum;
  witness_height_m: Datum;
  source_product: Datum<string>;
}
export interface WitnessEvent {
  target: 'sun' | 'earth';
  diagnostic: string;
  at: {
    time_utc: Datum<string>;
    target_azimuth_deg: Datum;
    target_elevation_deg: Datum;
    interpolated_horizon_deg: Datum;
    clearance_deg: Datum;
  };
  rays: WitnessRay[];
  sample_before_index: number;
  sample_after_index: number;
}
export interface ExplainModel {
  schema: 'resolve.explain.model.v1';
  key: string;
  model: string;
  observer: string;
  label: string;
  ground: Datum;
  absolute: Datum;
  above_ground: Datum;
  skyline: [number, number][];
  snapshots: PhysicsSample[];
  source_refs: { horizon: string; solution: string };
  solar_onset: WitnessEvent;
  simultaneous_end: WitnessEvent;
}
export interface ExplainPair {
  site: string;
  comparison: string;
  factor: string;
  supported: boolean;
  before: string | null;
  after: string | null;
}
export interface ExplainManifest {
  schema: 'resolve.explain.v1';
  domain: {
    start_utc: string;
    end_utc: string;
    sample_count: number;
    step_s: number;
    default_utc: string;
  };
  geometry: { frame: string; ephemeris: string; aberration: string; semantics: string };
  factor_sites: FactorManifest['sites'];
  models: Record<string, ModelRef>;
  sections: Record<string, FileRef>;
  pairs: Record<string, ExplainPair>;
  sources: Record<string, { path: string; sha256: string; bytes: number }>;
  plot: {
    elevation: [number, number];
    solar_sector: [number, number];
    full_sector: [number, number];
  };
  aligned_finding: { sdemGroundOffset: Datum; alignedRange: Datum; aligned80Minus5Height: Datum };
  limitations: string[];
}
export const physicsUTC = (manifest: Pick<ExplainManifest, 'domain'>, index: number) =>
  new Date(
    Date.parse(manifest.domain.start_utc) + index * manifest.domain.step_s * 1000,
  ).toISOString();
export const physicsIndex = (manifest: Pick<ExplainManifest, 'domain'>, value: string) =>
  Math.max(
    0,
    Math.min(
      manifest.domain.sample_count - 1,
      Math.round(
        (Date.parse(value) - Date.parse(manifest.domain.start_utc)) /
          (manifest.domain.step_s * 1000),
      ),
    ),
  );
export function endpointAssociation(
  value: {
    leftCensored: { value: boolean };
    rightCensored: { value: boolean };
    start: { value: string };
    end: { value: string };
  },
  model: ExplainModel,
) {
  const matches = (a: string, b: string) => Math.abs(Date.parse(a) - Date.parse(b)) <= 50;
  return {
    start: value.leftCensored.value
      ? 'Reporting boundary — not a physical rise'
      : matches(value.start.value, model.solar_onset.at.time_utc.value)
        ? 'Sun onset — matched stored witness'
        : 'No matched start witness packaged',
    end: value.rightCensored.value
      ? 'Reporting boundary — not a physical set'
      : matches(value.end.value, model.simultaneous_end.at.time_utc.value)
        ? `${model.simultaneous_end.target === 'earth' ? 'Earth' : 'Sun'} visibility end — matched stored witness`
        : 'No matched end witness packaged',
  };
}
