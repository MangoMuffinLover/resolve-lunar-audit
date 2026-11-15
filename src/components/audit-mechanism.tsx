'use client';
import { useEffect, useState } from 'react';
import type { ExplainManifest, ExplainModel } from '@/lib/explanation-contract';
import { physicsIndex, physicsUTC } from '@/lib/explanation-contract';
import { verifiedJSON } from '@/lib/verified-json';
import { CommonClockSky } from './physical-comparison';
import { distance, signed, utc } from '@/lib/format';

export type AuditPhysics = Pick<ExplainManifest, 'models' | 'domain' | 'plot'>;
export default function AuditMechanism({
  physics,
  selected,
  observer,
  domain,
  onReady,
}: {
  physics: AuditPhysics;
  selected: string;
  observer: string;
  domain: string;
  onReady: () => void;
}) {
  const beforeKey = `P78_5m_${observer}`,
    afterKey = `${selected}_${observer}`;
  const [records, setRecords] = useState<Record<string, ExplainModel>>({});
  const [failed, setFailed] = useState<string | null>(null),
    [retry, setRetry] = useState(0);
  const request = `${beforeKey}|${afterKey}`;
  const before = records[beforeKey],
    after = records[afterKey];
  useEffect(() => {
    if (before && after) {
      onReady();
      return;
    }
    let active = true;
    setFailed(null);
    Promise.all(
      [...new Set([beforeKey, afterKey])].map(async (key) => {
        const ref = physics.models[key];
        if (!ref) throw new Error('Unsupported physical record');
        const value = await verifiedJSON<ExplainModel>(ref, 'resolve.explain.model.v1');
        if (value.key !== key || value.snapshots.length !== physics.domain.sample_count)
          throw new Error('Physical identity mismatch');
        return value;
      }),
    )
      .then((values) => {
        if (active)
          setRecords((old) => ({ ...old, ...Object.fromEntries(values.map((v) => [v.key, v])) }));
      })
      .catch(() => {
        if (active) setFailed(request);
      });
    return () => {
      active = false;
    };
  }, [beforeKey, afterKey, before, after, physics, request, retry, onReady]);
  if (!before || !after)
    return failed === request ? (
      <div role="alert" className="mechanism-error">
        <strong>Physical evidence unavailable.</strong>
        <p>No previous comparison’s skyline is shown.</p>
        <button className="secondary-button" onClick={() => setRetry((n) => n + 1)}>
          Retry paired geometry
        </button>
        <a href="/explain/">Open the full physical workspace</a>
      </div>
    ) : (
      <p role="status" className="loading-profile">
        Verifying paired horizon records…
      </p>
    );
  const index = physicsIndex(physics, '2026-11-17T14:30:00.000Z'),
    time = physicsUTC(physics, index);
  const a = before.snapshots[index],
    b = after.snapshots[index];
  const full = `/explain/?${new URLSearchParams({ site: 'dGR101', comparison: `terrain-${selected}-${observer}-${domain}`, metric: 'simultaneous', utc: time })}`;
  return (
    <div className="audit-mechanism" data-testid="audit-mechanism">
      <div className="mechanism-clock">
        <span className="eyebrow">Shared-time diagnostic</span>
        <strong>
          {utc(time, true)} UTC <span>2026</span>
        </strong>
        <p>
          {observer === 'fixed_absolute'
            ? 'Same absolute observer and body positions.'
            : 'Same ephemeris; body positions follow each represented observer.'}
        </p>
      </div>
      <div className="mechanism-states">
        {[
          { model: before, sample: a, label: 'Reference' },
          { model: after, sample: b, label: 'Selected' },
        ].map(({ model, sample, label }) => (
          <div key={label}>
            <span className="eyebrow">
              {label} · {model.label}
            </span>
            <strong>{sample[10] ? 'Sun & Earth both above' : 'Sun & Earth not both above'}</strong>
            <p>the modeled horizon · Sun clearance {signed(Number(sample[3]), 3)}°</p>
          </div>
        ))}
      </div>
      <CommonClockSky
        before={before}
        after={after}
        index={index}
        manifest={physics}
        showMeasurements={false}
        fit
      />
      <p className="mechanism-caption">
        {domain === 'registered_domain'
          ? 'A shared-time diagnostic of the horizon mechanism. The selected durations are reporting-clipped; a cutoff is not a physical transition.'
          : 'A shared-time diagnostic of the horizon mechanism. The complete duration comparison uses saved event-bounded intervals; the simultaneous end can change too.'}
      </p>
      <details className="mechanism-witnesses">
        <summary>Trace the event to sampled terrain</summary>
        <p>
          These lower bracketing rays belong to different own-event times and azimuths. They are
          separate from the common-clock snapshot, and are sampled terrain witnesses rather than
          direct measurements.
        </p>
        <div className="mechanism-witness-grid">
          {[before, after].map((model, i) => {
            const w = model.solar_onset;
            const ray = w.rays.find((r) => r.bracket === 'lower')!;
            return (
              <div key={i}>
                <h3>{model.label}</h3>
                <strong>{distance(ray.surface_range_m.value)}</strong>
                <p>
                  {utc(w.at.time_utc.value, true)} UTC · {w.at.target_azimuth_deg.value.toFixed(4)}°
                  azimuth
                </p>
              </div>
            );
          })}
        </div>
      </details>
      <a className="context-link" href={full}>
        Inspect the full physical explanation <span aria-hidden="true">↗</span>
      </a>
    </div>
  );
}
