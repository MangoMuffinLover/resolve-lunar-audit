'use client';
import { useEffect, useState } from 'react';
import type { DemoData } from '@/lib/demo-contract';
import type { ExplainModel } from '@/lib/explanation-contract';
import { physicsIndex } from '@/lib/explanation-contract';
import { verifiedJSON } from '@/lib/verified-json';
import { CommonClockSky } from './physical-comparison';
import { distance, signed, utc } from '@/lib/format';

export default function DemoMechanism({
  data,
}: {
  data: Pick<DemoData, 'physical' | 'witnesses'>;
}) {
  const [models, setModels] = useState<ExplainModel[] | null>(null);
  const [failed, setFailed] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setFailed(false);
    Promise.all(
      [data.physical.before, data.physical.after].map(async (ref) => {
        const model = await verifiedJSON<ExplainModel>(ref, 'resolve.explain.model.v1');
        if (
          model.model !== ref.model ||
          model.observer !== ref.observer ||
          model.snapshots.length !== data.physical.manifest.domain.sample_count
        )
          throw new Error('Demo physical identity mismatch');
        return model;
      }),
    )
      .then((value) => {
        if (active) setModels(value);
      })
      .catch(() => {
        if (active) {
          setModels(null);
          setFailed(true);
        }
      });
    return () => {
      active = false;
    };
  }, [data.physical, retry]);
  if (failed)
    return (
      <div role="alert" className="demo-error">
        <p>
          The paired physical evidence could not be verified. No skyline or visibility state is
          shown.
        </p>
        <button className="secondary-button" onClick={() => setRetry((n) => n + 1)}>
          Retry demo geometry
        </button>
        <a href="/explain/">Open the complete physical explanation</a>
      </div>
    );
  if (!models) return <p role="status">Verifying the paired horizon records…</p>;
  const index = physicsIndex(data.physical.manifest, data.physical.snapshotUTC);
  const [before, after] = models,
    a = before.snapshots[index],
    b = after.snapshots[index];
  return (
    <div data-testid="demo-mechanism">
      <p className="demo-context">
        <strong>{utc(data.physical.snapshotUTC, true)} UTC, 2026</strong> · same absolute observer
        and Sun/Earth positions
      </p>
      <div
        className="demo-pair demo-visibility"
        role="group"
        aria-label="Stored simultaneous visibility at the common time"
      >
        <div>
          <strong>Product 78 · 5 m</strong>
          <p>
            {a[10]
              ? 'Sun & Earth both above the modeled horizon'
              : 'Sun & Earth not both above the modeled horizon'}
          </p>
          <p>Sun clearance {signed(a[3], 3)}°</p>
        </div>
        <div>
          <strong>Product 90 · 80 m</strong>
          <p>
            {b[10]
              ? 'Sun & Earth both above the modeled horizon'
              : 'Sun & Earth not both above the modeled horizon'}
          </p>
          <p>Sun clearance {signed(b[3], 3)}°</p>
        </div>
      </div>
      <CommonClockSky
        before={before}
        after={after}
        index={index}
        manifest={data.physical.manifest}
        showMeasurements={false}
      />
      <details className="demo-details">
        <summary>Trace the onset to sampled terrain</summary>
        <p>
          Own solar-onset witnesses occur at different times and azimuths. These are separate from
          the common-clock snapshot above. Each horizon interpolates two bracketing rays; the
          distances below identify the saved lower ray, not a direct measurement.
        </p>
        <div className="demo-pair">
          {[data.witnesses.before, data.witnesses.after].map((w, i) => (
            <div key={w.id}>
              <h3>{i ? 'Product 90 · 80 m' : 'Product 78 · 5 m'}</h3>
              <p className="demo-number-small">{distance(w.surface_range_m.value)}</p>
              <p>
                {utc(w.time_utc.value, true)} UTC · onset azimuth{' '}
                {w.target_azimuth_deg.value.toFixed(4)}°
              </p>
            </div>
          ))}
        </div>
        <p>
          The simultaneous-visibility end can change as well. The full explanation includes
          Earth-end witnesses and both bracketing rays.
        </p>
      </details>
      <a
        className="demo-deep-link"
        href="/explain/?comparison=terrain-P90_80m-fixed_absolute-uncensored_intersecting_registered&metric=simultaneous&utc=2026-11-17T14%3A30%3A00.000Z"
      >
        Inspect the full physical explanation →
      </a>
    </div>
  );
}
