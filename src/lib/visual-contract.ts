import type { FileRef, PhysicsSample } from './explanation-contract';
export interface VisualModel {
  key: string;
  label: string;
  skyline: [number, number][];
  sample: PhysicsSample;
}
export interface VisualBundle {
  schema: 'resolve.visual.sky.v1';
  observer: string;
  utc: string;
  models: Record<string, VisualModel>;
}
export interface VisualAssets {
  initial: VisualModel & { utc: string };
  refs: Record<string, FileRef>;
  sections: Record<string, FileRef>;
  utc: string;
}
export const ladder = ['P78_5m', 'P90_20m', 'P90_40m', 'P90_60m', 'P90_80m', 'P90_240m'];
export const spacings = ['5', '20', '40', '60', '80', '240'];
