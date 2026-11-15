export type Target = 'sun' | 'earth';
export type Metric = Target | 'simultaneous';
export interface NavigatorWindow {
  start_et_s: number;
  end_et_s: number;
  start_utc: string;
  end_utc: string;
  duration_s: number;
  left_censored: boolean;
  right_censored: boolean;
}
export interface SiteMeta {
  id: string;
  region: string;
  latitude_deg: number;
  longitude_east_deg: number;
  observer_height_m: number;
  ground_height_m: number;
  absolute_observer_height_m: number;
  local_product: string;
  exterior_products: string;
  azimuth_step_deg: number;
  radial_factor: number;
  max_distance_m: number;
  validation: string;
  horizon_source: string;
  visibility_source: string;
  visibility_pointer: string;
  href: string;
  sha256: string;
  bytes: number;
}
export interface BodyPosition {
  azimuth_deg: number;
  elevation_deg: number;
  horizon_deg: number;
  clearance_deg: number;
  visible: boolean;
}
export interface NavigatorSnapshot {
  utc: string;
  et_tdb_s: number;
  sun: BodyPosition;
  earth: BodyPosition;
  simultaneous_visible: boolean;
  overlap: {
    kind: 'current' | 'next' | 'none';
    interval_index: number | null;
    remaining_s: number | null;
  };
}
export interface NavigatorRecord {
  schema: 'resolve.navigator.site.v1';
  site: SiteMeta;
  skyline: [number, number][];
  source_refs: { skyline: string; intervals: string };
  intervals: Record<Metric, NavigatorWindow[]>;
  longest: Record<Metric, NavigatorWindow | null>;
  event_sampling_step_s: number;
  samples: NavigatorSnapshot[];
}
export interface NavigatorManifest {
  schema: 'resolve.navigator.v1';
  challenge_url: string;
  domain: {
    start_utc: string;
    end_utc: string;
    snapshot_step_s: number;
    sample_count: number;
    default_utc: string;
    default_site: string;
  };
  geometry: {
    frame: string;
    ephemeris: string;
    aberration: string;
    semantics: string;
    reference_radius_m: number;
    observer: string;
  };
  limitations: string[];
  sites: SiteMeta[];
  sources: Record<string, { path: string; sha256: string; bytes: number }>;
}

export const snapshotUTC = (manifest: NavigatorManifest, index: number) =>
  new Date(
    Date.parse(manifest.domain.start_utc) + index * manifest.domain.snapshot_step_s * 1000,
  ).toISOString();
export const snapshotIndex = (manifest: NavigatorManifest, utc: string) =>
  Math.max(
    0,
    Math.min(
      manifest.domain.sample_count - 1,
      Math.round(
        (Date.parse(utc) - Date.parse(manifest.domain.start_utc)) /
          (manifest.domain.snapshot_step_s * 1000),
      ),
    ),
  );
