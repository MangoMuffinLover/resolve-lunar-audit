import type { AuditData } from './contract';
import type { FactorManifest, AuditMetric, FactorRecord } from './factor-contract';

export interface ScienceData {
  schema: 'resolve.science.v1';
  sources: Record<
    string,
    { path: string; label: string; sha256: string; bytes: number; href: string }
  >;
  control: FactorManifest['sites'][number];
  studies: {
    id: string;
    title: string;
    site: string;
    finding: string;
    limit: string;
    findingSource: string;
    protocolSource: string;
  }[];
  geometry: AuditData['geometry'];
  footprint: string;
  products: {
    id: string;
    label: string;
    kind: string;
    spacing_m: number;
    nasaUrl: string | null;
    raster: string;
    sha256: string | null;
    hashScope: string;
    description: string;
  }[];
  kernels: { path: string; sha256: string; bytes: number; url: string | null }[];
  validation: {
    spatial: ScientificValue;
    temporal: ScientificValue;
    effect: ScientificValue;
    spatialChecks: number;
    temporalChecks: number;
    cutoffChecks: number;
    cutoffPassed: boolean;
    seamCheck: boolean;
    savedVerification: {
      passed: boolean;
      response_rows: number;
      strict_json_files_checked: number;
      frozen_r01ab_files_unchanged: number;
      required_deliverables: number;
      all_scoped_threshold_flags_correct: boolean;
      registered_and_physical_csv_match_model_solutions_within_s: number;
      official_clone_files: number;
      required_figures_visual_qa: boolean;
    };
  };
  integrity: { files: number; href: string; sha256: string };
  researchManifest: { path: string; sha256: string };
  generator: { path: string; sha256: string };
}
interface ScientificValue {
  value: number;
  unit: string;
  sourceId: string;
  pointer: string;
}

export const controlRows = (record: FactorRecord, study: 'pilot' | 'modeling') =>
  record.comparisons.filter((c) =>
    study === 'pilot' ? c.scope === 'r01a-dgr203-five-clones' : c.scope.startsWith('r01b-dgr203-'),
  );
export const benchmarkState = (metric: AuditMetric, days: number) =>
  metric === 'earth'
    ? 'No historical Earth-only benchmark'
    : `${days >= (metric === 'sun' ? 10 : 6.5) ? 'Meets' : 'Below'} ${metric === 'sun' ? '10-day solar screen' : '6.5-day simultaneous benchmark'}`;
