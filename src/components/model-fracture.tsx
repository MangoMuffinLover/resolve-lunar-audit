'use client';
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
  const element = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ width: 1000, height: 360 });
  useEffect(() => {
    if (!element.current) return;
    const node = element.current;
    const measure = () =>
      setSize({ width: Math.round(node.clientWidth), height: Math.round(node.clientHeight) });
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(node);
    return () => resize.disconnect();
  }, []);
  const { width, height } = size,
    margin = width < 600 ? 22 : 40;
  const x = (az: number) => margin + ((az - 40) / 130) * (width - margin * 2);
  const y = (elevation: number) => height * 0.56 - elevation * height * 0.05;
  const path = (points: [number, number][]) =>
    points.map(([az, el], i) => `${i ? 'L' : 'M'}${x(az).toFixed(2)},${y(el).toFixed(2)}`).join('');
  const current = path(model.skyline),
    prior = path(reference.skyline);
  const sample = model.sample;
  return (
    <svg
      ref={element}
      viewBox={`0 0 ${width} ${height}`}
      className="fracture-sky"
      role="img"
      aria-label={`Frozen angular skyline: ${model.label}. Sun and Earth centers at 17 November 2026 14:30 UTC. Display projection, not a terrain mesh.`}
      data-testid="fracture-sky"
    >
      <defs>
        <linearGradient id="lunar-plane" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#69716f" />
          <stop offset="1" stopColor="#181f21" />
        </linearGradient>
      </defs>
      <line x1={margin} x2={width - margin} y1={y(0)} y2={y(0)} className="fracture-datum" />
      <path
        key={model.key}
        d={`${current}L${width - margin},${height - 48}L${margin},${height - 48}Z`}
        fill="url(#lunar-plane)"
        className="fracture-surface"
      />
      {audited && model.key !== reference.key && <path d={prior} className="fracture-reference" />}
      <path key={`${model.key}-edge`} d={current} className="fracture-edge" />
      <g
        data-testid="fracture-sun"
        transform={`translate(${x(Number(sample[0]))},${y(Number(sample[1]))})`}
      >
        <circle r="9" className="fracture-sun" />
        <circle r="16" className="fracture-marker-ring" />
        <text x="0" y="-29" textAnchor="middle">
          SUN CENTER
        </text>
      </g>
      <g
        data-testid="fracture-earth"
        transform={`translate(${x(Number(sample[5]))},${y(Number(sample[6]))})`}
      >
        <path d="M0,-7L7,0L0,7L-7,0Z" className="fracture-earth" />
        <text x="0" y="-22" textAnchor="middle">
          EARTH CENTER
        </text>
      </g>
      {[40, 80, 120, 170].map((az) => (
        <g key={az} className="fracture-axis">
          <line x1={x(az)} x2={x(az)} y1={height - 48} y2={height - 40} />
          <text x={x(az)} y={height - 23} textAnchor="middle">
            {az}°
          </text>
        </g>
      ))}
      <text x={width / 2} y={height - 3} textAnchor="middle" className="fracture-axis-title">
        AZIMUTH CLOCKWISE FROM GEOGRAPHIC NORTH
      </text>
    </svg>
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
}) {
  const [bundles, setBundles] = useState<Record<string, VisualBundle>>({});
  const [failed, setFailed] = useState<string | null>(null),
    [retry, setRetry] = useState(0);
  const [playing, setPlaying] = useState(false),
    [reduced, setReduced] = useState(true);
  const [constant, setConstant] = useState(false),
    [isolated, setIsolated] = useState(false);
  useEffect(() => {
    if (!constant) return;
    const timer = setTimeout(() => setConstant(false), 1700);
    return () => clearTimeout(timer);
  }, [constant]);
  const heading = useRef<HTMLHeadingElement>(null),
    playingObserver = useRef(observer);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      setReduced(media.matches);
      if (media.matches) setPlaying(false);
    };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
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
    if (!playing || !bundle) return;
    if (observer !== playingObserver.current || domain !== 'uncensored_intersecting_registered') {
      setPlaying(false);
      return;
    }
    const ids = ladder.slice(1, 5);
    let step = 0;
    const tick = setInterval(() => {
      onSelect(ids[step++]);
      if (step === ids.length) {
        clearInterval(tick);
        setPlaying(false);
        setConstant(true);
      }
    }, 650);
    const pause = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener('visibilitychange', pause);
    return () => {
      clearInterval(tick);
      document.removeEventListener('visibilitychange', pause);
    };
  }, [playing, bundle, observer, domain, onSelect]);
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
    setConstant(false);
    setIsolated(false);
    resetDefinitions();
    playingObserver.current = 'fixed_absolute';
    onAudit();
    onSelect(reduced ? 'P90_80m' : 'P78_5m');
    setPlaying(!reduced);
  }
  function choose(index: number) {
    setConstant(false);
    setIsolated(false);
    setPlaying(false);
    onSelect(ladder[index]);
  }
  return (
    <section
      className={`model-fracture ${audited ? 'is-audited' : ''} ${playing ? 'is-playing' : ''} ${observer === 'fixed_absolute' && (constant || isolated) ? 'is-constant' : ''}`}
      aria-labelledby="result-heading"
      data-testid="model-fracture"
    >
      <div className="fracture-topline">
        <span>RESOLVE / OBSERVATION 01</span>
        <button
          className="fracture-evidence-link"
          onClick={(event) => {
            setPlaying(false);
            setConstant(false);
            event.currentTarget.focus();
            onEvidence();
          }}
        >
          Result evidence <span aria-hidden="true">↗</span>
        </button>
      </div>
      <div className="fracture-heading">
        <p className="eyebrow">A lunar visibility audit</p>
        <h1 id="result-heading">
          Before you trust the window,
          <br /> <em>audit the model.</em>
        </h1>
      </div>
      <div className="fracture-field">
        {audited && observer === 'fixed_absolute' && (constant || isolated) && (
          <div className="constant-overlay" role="status">
            <span>AT THIS SHARED UTC</span>
            <strong>
              The Sun never moved.
              <br />
              <em>The terrain model did.</em>
            </strong>
          </div>
        )}
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
          <span>FROZEN ANGULAR SKYLINE / 2.5D DISPLAY PROJECTION</span>
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
                {playing
                  ? 'EVALUATING DISCRETE STATES'
                  : displayId === 'P78_5m'
                    ? 'REFERENCE SELECTED'
                    : data.classification}
              </span>
            </div>
            <div className="fracture-values" aria-live={playing ? 'off' : 'polite'}>
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
              disabled={playing}
              onClick={() => {
                setPlaying(false);
                setConstant(false);
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
          <div className="scrub-title">
            <label htmlFor="model-scrub">TERRAIN REPRESENTATION</label>
            <span>Discrete evaluated representations</span>
            {observer === 'fixed_absolute' && (
              <button
                className="scrub-play isolate-button"
                aria-pressed={isolated}
                onClick={() => {
                  setConstant(false);
                  setPlaying(false);
                  setIsolated((value) => !value);
                }}
              >
                Isolate the Sun
              </button>
            )}
            <button className="scrub-play" onClick={() => (playing ? setPlaying(false) : start())}>
              {playing ? 'Pause sequence' : reduced ? 'Show 80 m comparison' : 'Replay sequence'}
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
