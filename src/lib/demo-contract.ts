import type { AuditData, AuditCase, Witness } from './contract';
import type { ExplainManifest, ModelRef } from './explanation-contract';
import type { ScienceData } from './science-contract';
import type { NavigatorManifest } from './navigator-contract';

export const demoSteps = [
  { id: 'result', label: 'Result', title: 'Before you trust the window, audit the model.' },
  { id: 'audit', label: 'Audit', title: 'The same question. A different terrain representation.' },
  { id: 'mechanism', label: 'Why', title: 'The horizon changes the visibility decision.' },
  { id: 'controls', label: 'Assumptions', title: 'The observer and reporting domain also matter.' },
  { id: 'negative', label: 'Negative evidence', title: 'A valid audit can preserve the decision.' },
  {
    id: 'evidence',
    label: 'Evidence & use',
    title: 'Inspect the opportunity. Then audit the answer.',
  },
] as const;

export interface DemoData {
  baseline: AuditCase;
  native80: AuditCase;
  sdemFixed: AuditCase;
  sdemSurface: AuditCase;
  clipped: AuditCase;
  witnesses: { before: Witness; after: Witness };
  physical: {
    before: ModelRef;
    after: ModelRef;
    manifest: Pick<ExplainManifest, 'domain' | 'plot'>;
    snapshotUTC: string;
  };
  control: ScienceData['control'];
  responseSource: AuditData['sources'][string];
  pilotSource: ScienceData['sources'][string];
  validation: Pick<ScienceData['validation'], 'spatial' | 'temporal'>;
  navigator: { sites: string[]; start: string; end: string };
}

export function createDemoData(
  audit: AuditData,
  explanation: ExplainManifest,
  science: ScienceData,
  navigator: NavigatorManifest,
): DemoData {
  const physicalDomain = 'uncensored_intersecting_registered';
  function readCase(id: string, observer = 'fixed_absolute', domain = physicalDomain) {
    const item = audit.cases[`${id}:${observer}:${domain}`];
    if (!item || item.id !== id || item.observer !== observer || item.domain !== domain)
      throw new Error('Demonstration case identity mismatch');
    return item;
  }
  function witness(id: string) {
    const item = audit.witnesses.find(
      (w) =>
        w.id === id && w.observer === 'fixed_absolute' && w.diagnostic === 'own_late_solar_onset',
    );
    if (!item) throw new Error('Demonstration witness unavailable');
    return item;
  }
  const before = explanation.models.P78_5m_fixed_absolute,
    after = explanation.models.P90_80m_fixed_absolute;
  if (!before || !after || science.control.id !== 'dGR203')
    throw new Error('Demonstration evidence unavailable');
  return {
    baseline: readCase('P78_5m'),
    native80: readCase('P90_80m'),
    sdemFixed: readCase('P104_5m'),
    sdemSurface: readCase('P104_5m', 'each_surface_2m'),
    clipped: readCase('P78_5m', 'fixed_absolute', 'registered_domain'),
    witnesses: { before: witness('P78_5m'), after: witness('P90_80m') },
    physical: {
      before,
      after,
      manifest: { domain: explanation.domain, plot: explanation.plot },
      snapshotUTC: '2026-11-17T14:30:00.000Z',
    },
    control: science.control,
    responseSource: audit.sources.response,
    pilotSource: science.sources.pilot,
    validation: { spatial: science.validation.spatial, temporal: science.validation.temporal },
    navigator: {
      sites: navigator.sites.map((s) => s.id),
      start: navigator.domain.start_utc,
      end: navigator.domain.end_utc,
    },
  };
}
