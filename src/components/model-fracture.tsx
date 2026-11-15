'use client';
import { projectIdentity } from '@/lib/identity';
import { useEffect, useRef, useState } from 'react';
import type { AuditData, Domain, Observer } from '@/lib/contract';
import { caseKey } from '@/lib/contract';
import type { VisualAssets, VisualBundle, VisualModel } from '@/lib/visual-contract';
import { ladder, spacings } from '@/lib/visual-contract';
import { verifiedJSON } from '@/lib/verified-json';
import { distance, fixed, signed, utc } from '@/lib/format';

const loads = new Map<string, Promise<VisualBundle>>();
function load(visual: VisualAssets, observer: Observer) {
  const ref = visual.refs[observer];
  let promise = loads.get(ref.sha256);
  if (!promise) {
    promise = verifiedJSON<VisualBundle>(ref, 'resolve.visual.sky.v1')
      .then((value) => {
        if (
          value.observer !== observer ||
          value.utc !== visual.utc ||
          ladder.some((id) => !value.models[id])
        )
          throw new Error('Visual identity mismatch');
        return value;
      })
      .catch((error) => {
        loads.delete(ref.sha256);
        throw error;
      });
    loads.set(ref.sha256, promise);
  }
  return promise;
}
function Scene({
  model,
  reference,
  audited,
}: {
  model: VisualModel;
  reference: VisualModel;
  audited: boolean;
}) {
  const previousModel = useRef(model);
  const previous = previousModel.current;
  useEffect(() => {
    previousModel.current = model;
  }, [model]);
  const x = (az: number) => 50 + ((az - 40) / 130) * 900;
  const y = (elevation: number) => 360 * (0.56 - elevation * 0.05);
  const path = (points: [number, number][]) =>
    points.map(([az, el], i) => `${i ? 'L' : 'M'}${x(az).toFixed(2)},${y(el).toFixed(2)}`).join('');
  const current = path(model.skyline),
    prior = path(reference.skyline),
    sample = model.sample;
  return (
    <div
      className="fracture-canvas"
      role="img"
      aria-label={`Frozen angular skyline: ${model.label}. Sun and Earth centers at 17 November 2026 14:30 UTC. Display projection, not a terrain mesh.`}
      data-testid="fracture-sky"
    >
      <svg
        viewBox="0 0 1000 360"
        preserveAspectRatio="none"
        className="fracture-sky"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="lunar-plane" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#69716f" />
            <stop offset="1" stopColor="#181f21" />
          </linearGradient>
        </defs>
        {[0, 2, 4].map((elevation) => (
          <line
            key={elevation}
            x1="50"
            x2="950"
            y1={y(elevation)}
            y2={y(elevation)}
            className="sky-grid"
          />
        ))}
        <line x1="50" x2="950" y1={y(0)} y2={y(0)} className="fracture-datum" />
        {audited && previous.key !== model.key && (
          <path
            key={`${model.key}-previous`}
            d={`${path(previous.skyline)}L950,300L50,300Z`}
            fill="url(#lunar-plane)"
            className="fracture-surface-previous"
          />
        )}
        <path
          key={model.key}
          d={`${current}L950,300L50,300Z`}
          fill="url(#lunar-plane)"
          className="fracture-surface"
        />
        {audited && model.key !== reference.key && (
          <path d={prior} className="fracture-reference" />
        )}
        <path key={`${model.key}-edge`} d={current} className="fracture-edge" />
      </svg>
      <div
        className="fracture-body-marker is-sun"
        data-testid="fracture-sun"
        data-center-position={`${sample[0]},${sample[1]}`}
        style={{ left: `${x(Number(sample[0])) / 10}%`, top: `${y(Number(sample[1])) / 3.6}%` }}
      >
        <span>SUN CENTER</span>
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="9" className="fracture-sun" />
          <circle cx="20" cy="20" r="16" className="fracture-marker-ring" />
        </svg>
      </div>
      <div
        className="fracture-body-marker is-earth"
        data-testid="fracture-earth"
        data-center-position={`${sample[5]},${sample[6]}`}
        style={{ left: `${x(Number(sample[5])) / 10}%`, top: `${y(Number(sample[6])) / 3.6}%` }}
      >
        <span>EARTH CENTER</span>
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <path d="M20,13L27,20L20,27L13,20Z" className="fracture-earth" />
        </svg>
      </div>
      <div className="sky-elevation-axis" aria-hidden="true">
        {[0, 2, 4].map((elevation) => (
          <span key={elevation} style={{ top: `${y(elevation) / 3.6}%` }}>
            {elevation}°
          </span>
        ))}
      </div>
      <div className="fracture-azimuth-axis" aria-hidden="true">
        {[40, 80, 120, 170].map((az) => (
          <span key={az} style={{ left: `${x(az) / 10}%` }}>
            {az}°
          </span>
        ))}
      </div>
      <span className="fracture-azimuth-title" aria-hidden="true">
        AZIMUTH CLOCKWISE FROM GEOGRAPHIC NORTH
      </span>
    </div>
  );
}

export function ModelFracture({
  data,
  visual,
  audited,
  selected,
  observer,
  domain,
  onSelect,
  onAudit,
  onWhy,
  onEvidence,
  resetDefinitions,
  manualRevision,
}: {
  data: AuditData;
  visual: VisualAssets;
  audited: boolean;
  selected: string;
  observer: Observer;
  domain: Domain;
  onSelect: (id: string) => void;
  onAudit: () => void;
  onWhy: () => void;
  onEvidence: () => void;
  resetDefinitions: () => void;
  manualRevision: number;
}) {
  const [bundles, setBundles] = useState<Record<string, VisualBundle>>({});
  const [failed, setFailed] = useState<string | null>(null),
    [retry, setRetry] = useState(0);
  const [isolated, setIsolated] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousManualRevision = useRef(manualRevision);
  useEffect(() => {
    if (previousManualRevision.current !== manualRevision) {
      previousManualRevision.current = manualRevision;
      setIsolated(false);
    }
  }, [manualRevision]);
  const bundle = bundles[observer];
  useEffect(() => {
    if (bundle) return;
    let active = true;
    setFailed(null);
    load(visual, observer)
      .then((value) => {
        if (active) setBundles((old) => ({ ...old, [observer]: value }));
      })
      .catch(() => {
        if (active) setFailed(observer);
      });
    return () => {
      active = false;
    };
  }, [bundle, observer, retry, visual]);
  useEffect(() => {
    if (audited) heading.current?.focus({ preventScroll: true });
  }, [audited]);
  const displayId = audited ? selected : 'P78_5m';
  const model =
    bundle?.models[displayId] ||
    (!audited && observer === 'fixed_absolute' ? visual.initial : undefined);
  const reference =
    bundle?.models.P78_5m || (observer === 'fixed_absolute' ? visual.initial : undefined);
  const result = data.cases[caseKey(displayId, observer, domain)],
    base = data.cases[caseKey('P78_5m', observer, domain)];
  const representation = data.representations.find((m) => m.id === displayId)!;
  const witness = data.witnesses.find(
    (w) => w.id === displayId && w.observer === observer && w.diagnostic === 'own_late_solar_onset',
  )!;
  const nativeIndex = ladder.indexOf(displayId);
  function start() {
    setIsolated(false);
    resetDefinitions();
    onAudit();
    onSelect('P90_80m');
  }
  function choose(index: number) {
    setIsolated(false);
    onSelect(ladder[index]);
  }
  return (
    <section
      className={`model-fracture ${audited ? 'is-audited' : ''} ${observer === 'fixed_absolute' && isolated ? 'is-constant' : ''}`}
      aria-labelledby="result-heading"
      data-testid="model-fracture"
    >
      <div className="fracture-topline">
        <span>RESOLVE / OBSERVATION 01</span>
        <button
          className="fracture-evidence-link"
          onClick={(event) => {
            event.currentTarget.focus();
            onEvidence();
          }}
        >
          Result evidence <span aria-hidden="true">↗</span>
        </button>
      </div>
      <div className="fracture-heading">
        <p className="eyebrow">{projectIdentity.brand}</p>
        <p className="project-expanded-name">{projectIdentity.name}</p>
        <h1 id="result-heading">
          Before you trust the window,
          <br /> <em>audit the model.</em>
        </h1>
      </div>
      <div className="fracture-field">
        <div className="fracture-site">
          <strong>{data.site}</strong>
          <span>88.513° S / 68.015° W</span>
        </div>
        <div className="fracture-clock">
          <span>ONE STORED UTC SNAPSHOT</span>
          <strong>17 NOV 2026 / 14:30</strong>
          <span>
            {observer === 'fixed_absolute'
              ? 'Fixed absolute observer'
              : '2 m above each represented surface'}
          </span>
        </div>
        {model && reference ? (
          <Scene model={model} reference={reference} audited={audited} />
        ) : (
          <div className="fracture-loading" role={failed === observer ? 'alert' : 'status'}>
            {failed === observer ? (
              <>
                <strong>Skyline evidence unavailable.</strong>
                <p>No previous comparison is shown.</p>
                <button onClick={() => setRetry((n) => n + 1)}>Retry visual evidence</button>
              </>
            ) : (
              <>Verifying frozen skyline records…</>
            )}
          </div>
        )}
        <div className="fracture-geometry-note">
          <span>HORIZON ELEVATION (°) / FROZEN ANGULAR SKYLINE</span>
          <span>
            {audited
              ? 'Dashed: P78 reference · solid: selected product'
              : 'Sun & Earth markers show centers, not disc sizes'}
          </span>
        </div>
      </div>
      <div className="fracture-readout">
        <div className="fracture-reference-result">
          <span className="eyebrow">
            {audited ? 'The anchored reference' : 'Predicted simultaneous Sun/Earth visibility'}
          </span>
          <output
            data-testid="initial-duration"
            aria-label={`${base.simultaneous.days.original} days`}
          >
            <span>{fixed(base.simultaneous.days.value)}</span>
            <small>DAYS</small>
          </output>
          <p>NASA Product 78 · 5 m terrain representation</p>
        </div>
        {!audited ? (
          <div className="fracture-opening-action">
            <p>
              Fixed absolute observer
              <br />
              <span className="observer-plain-language">
                The same physical observer elevation across terrain representations.
              </span>
              <br />
              Complete modeled interval
            </p>
            <button className="primary-button" onClick={start}>
              Audit this result <span aria-hidden="true">↗</span>
            </button>
          </div>
        ) : (
          <div className="fracture-selected-result">
            <div className="fracture-selected-label">
              <span className="eyebrow" data-testid="selected-label">
                {representation.label}
              </span>
              <span className="fracture-status">
                {displayId === 'P78_5m' ? 'REFERENCE SELECTED' : data.classification}
              </span>
            </div>
            <div className="fracture-values" aria-live="polite">
              <output
                key={result.id + observer + domain}
                data-testid="selected-duration"
                aria-label={`${result.simultaneous.days.original} days`}
              >
                {fixed(result.simultaneous.days.value)}
                <small>DAYS</small>
              </output>
              <strong data-testid="selected-delta">{signed(result.delta.value)} d</strong>
            </div>
            <h2 ref={heading} tabIndex={-1}>
              {displayId === 'P78_5m'
                ? 'The reference is selected.'
                : representation.type === 'synthetic-control'
                  ? 'A synthetic control. A different modeled window.'
                  : 'Another NASA terrain representation. Another modeled window.'}
            </h2>
            <button
              className="primary-button fracture-why"
              onClick={() => {
                onWhy();
              }}
            >
              See why it changes <span aria-hidden="true">↘</span>
            </button>
          </div>
        )}
      </div>
      {audited && (
        <div className="model-scrub" data-testid="model-scrub">
          {isolated && observer === 'fixed_absolute' && (
            <div className="sun-insight" role="status">
              <span className="eyebrow">02 / Hold the geometry fixed</span>
              <strong>
                The Sun never moved. <em>The terrain model did.</em>
              </strong>
              <p>
                The markers stay at the same stored UTC positions. This view holds until you choose
                another step.
              </p>
            </div>
          )}
          <p className="interaction-instruction">
            One step at a time. Tap a model to compare it, isolate the Sun, or choose Why. Nothing
            advances automatically.
          </p>
          <div className="scrub-title">
            <label htmlFor="model-scrub">TERRAIN REPRESENTATION</label>
            <span>Discrete evaluated representations</span>
            {observer === 'fixed_absolute' && (
              <button
                className="scrub-play isolate-button"
                aria-pressed={isolated}
                onClick={() => {
                  setIsolated((value) => !value);
                }}
              >
                Isolate the Sun
              </button>
            )}
            <button className="scrub-play" onClick={start}>
              Reset to 80 m comparison
            </button>
          </div>
          <input
            id="model-scrub"
            type="range"
            min="0"
            max="5"
            step="1"
            value={Math.max(0, nativeIndex)}
            onChange={(e) => choose(Number(e.target.value))}
            aria-label="Scrub discrete terrain representations"
            aria-valuetext={
              nativeIndex < 0
                ? 'Separate terrain family selected'
                : `${spacings[nativeIndex]} metre product, ${fixed(result.simultaneous.days.value)} days`
            }
          />
          <div className="scrub-stops">
            {ladder.map((id, index) => (
              <button
                key={id}
                onClick={() => choose(index)}
                aria-pressed={id === displayId}
                aria-label={`Inspect native ${spacings[index]} metre representation`}
              >
                <span>
                  {spacings[index]}
                  <small>m</small>
                </span>
              </button>
            ))}
          </div>
          {nativeIndex < 0 && (
            <p className="separate-family-note">
              {representation.type === 'separate-sdem'
                ? 'Product 104 is a separate terrain family.'
                : 'Synthetic control: separate from the native NASA ladder.'}
            </p>
          )}
          <div className="fracture-event-readout">
            <div>
              <span>OWN SOLAR-ONSET WITNESS</span>
              <strong data-testid="scrub-witness">{distance(witness.surface_range_m.value)}</strong>
            </div>
            <div>
              <span>OWN EVENT / UTC</span>
              <strong>{utc(witness.time_utc.value, true)}</strong>
            </div>
          </div>
          <p className="fracture-scope">
            {observer === 'fixed_absolute'
              ? 'Same site · same celestial geometry · same absolute observer.'
              : 'Same ephemeris; body positions follow each represented observer.'}{' '}
            {domain === 'registered_domain'
              ? 'Durations are reporting-clipped.'
              : 'Complete modeled episodes intersecting Nov 6–28.'}{' '}
            Window and witness use their saved event records; the sky holds one common time.
            Crossfade is a visual transition.
          </p>
        </div>
      )}
      <p className="fracture-disclaimer">
        Geometric Sun/Earth centers. This does not establish available power, a working
        communications link or mission approval.
      </p>
    </section>
  );
}
