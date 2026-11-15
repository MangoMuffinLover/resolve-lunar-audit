'use client';
import { SiteHeader, SiteFooter } from '@/components/site-header';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ExplainManifest, ExplainModel } from '@/lib/explanation-contract';
import { endpointAssociation, physicsIndex, physicsUTC } from '@/lib/explanation-contract';
import type { AuditMetric, Comparison, FactorRecord, Measurement } from '@/lib/factor-contract';
import { formatEffect, matchingComparisons } from '@/lib/factor-contract';
import { verifiedJSON } from '@/lib/verified-json';
import { fixed, utc } from '@/lib/format';
import {
  CommonClockSky,
  EventWitnesses,
  FrozenSections,
  ObserverDatum,
} from './physical-comparison';

const defaultComparison = 'terrain-P90_80m-fixed_absolute-uncensored_intersecting_registered';
const native = ['P78_5m', 'P90_20m', 'P90_40m', 'P90_60m', 'P90_80m', 'P90_240m'];
const conceptual: Record<string, string> = {
  terrain:
    'This contrast changes a terrain representation under its recorded observer convention. A matched R-01C skyline is not a substitute for this earlier study’s horizon.',
  observer:
    'This study changes physical observer height. It is a different configuration question from the fixed-absolute versus surface-relative R-01C comparison.',
  temporal:
    'This study changes discrete sampling or the duration estimator. The reported duration changes without establishing a new physical rise or set. Discrete samples do not prove between-sample continuity.',
  domain:
    'The reporting endpoint changes. A censored boundary truncates a statistic; it does not make the Sun or Earth physically disappear.',
  semantics:
    'The acceptance criterion changes. Center-visible requires the center above the skyline; any-disc and full-disc apply different spherical-body criteria. This is a changed observable, not a same-requirement terrain error.',
  stochastic:
    'This is the separate first-five-clone seasonal pilot. Its model-specific terrain contribution has not been attributed by the R-01C near-field mechanism. The pilot is not a probability distribution.',
};

function IntervalEvidence({
  before,
  after,
  index,
  manifest,
  supported,
}: {
  before: Measurement;
  after: Measurement;
  index: number;
  manifest: ExplainManifest;
  supported: boolean;
}) {
  const minimum = Math.min(Date.parse(before.start.value), Date.parse(after.start.value)),
    maximum = Math.max(Date.parse(before.end.value), Date.parse(after.end.value));
  const span = Math.max(1, maximum - minimum),
    pad = span * 0.04;
  const x = (time: number) => 70 + ((time - minimum + pad) / (span + pad * 2)) * 780;
  const cutoff = before.rightCensored.value ? Date.parse(before.end.value) : null;
  const current = Date.parse(physicsUTC(manifest, index));
  return (
    <section className="explain-intervals">
      <h2>Which boundaries belong to the result?</h2>
      <div
        className="explain-plot-scroll"
        role="region"
        aria-label="Before and after stored intervals; scroll horizontally on small screens"
        tabIndex={0}
      >
        <svg
          viewBox="0 0 920 190"
          role="img"
          aria-label="Stored before and after intervals; chevrons mark censored boundaries"
          data-testid="explain-intervals"
        >
          {[before, after].map((m, i) => (
            <g key={i}>
              <text x="5" y={48 + i * 63} className="plot-label">
                {i ? 'After' : 'Before'}
              </text>
              <rect
                x={x(Date.parse(m.start.value))}
                y={32 + i * 63}
                width={Math.max(1, x(Date.parse(m.end.value)) - x(Date.parse(m.start.value)))}
                height="23"
                className={i ? 'explain-interval-after' : 'explain-interval-before'}
              />
              {m.leftCensored.value && (
                <path
                  d={`M${x(Date.parse(m.start.value)) + 6},${35 + i * 63}l-4 8 4 8`}
                  className="navigator-censor"
                />
              )}
              {m.rightCensored.value && (
                <path
                  d={`M${x(Date.parse(m.end.value)) - 6},${35 + i * 63}l4 8-4 8`}
                  className="navigator-censor"
                />
              )}
              <text x={x(Date.parse(m.start.value))} y={70 + i * 63} className="plot-label">
                {utc(m.start.value, true)}
              </text>
              <text
                x={x(Date.parse(m.end.value))}
                y={70 + i * 63}
                textAnchor="end"
                className="plot-label"
              >
                {utc(m.end.value, true)}
              </text>
            </g>
          ))}
          {cutoff !== null && (
            <g>
              <line
                x1={x(cutoff)}
                x2={x(cutoff)}
                y1="15"
                y2="125"
                className="explain-report-cutoff"
              />
              <text x={x(cutoff)} y="170" textAnchor="end" className="plot-label">
                Before reporting cutoff
              </text>
            </g>
          )}
          {supported && current >= minimum && current <= maximum && (
            <line x1={x(current)} x2={x(current)} y1="15" y2="125" className="navigator-cursor" />
          )}
        </svg>
      </div>
      <p className="explain-small">
        Bars copy the selected stored intervals. Chevrons mark censoring, not physical transitions.{' '}
        {supported ? 'The dark dashed cursor is the current stored snapshot.' : ''}
      </p>
      <div className="explain-endpoint-grid">
        {[before, after].map((m, i) => (
          <div key={i}>
            <h3>
              {i ? 'After' : 'Before'} · {fixed(m.days)} days
            </h3>
            <p>
              {utc(m.start.value, true)} → {utc(m.end.value, true)} UTC
            </p>
            <p>
              {m.leftCensored.value || m.rightCensored.value
                ? 'Contains a clipped reporting boundary.'
                : 'No censoring in this selected interval.'}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function EndpointAttribution({
  before,
  after,
  modelBefore,
  modelAfter,
}: {
  before: Measurement;
  after: Measurement;
  modelBefore: ExplainModel;
  modelAfter: ExplainModel;
}) {
  return (
    <section className="endpoint-attribution">
      <h2>Trace the endpoints to saved witnesses</h2>
      <div className="explain-endpoint-grid">
        {[
          { label: 'Before', point: before, model: modelBefore },
          { label: 'After', point: after, model: modelAfter },
        ].map(({ label, point, model }) => {
          const a = endpointAssociation(point, model);
          return (
            <div key={label}>
              <h3>{label}</h3>
              <p>Start: {a.start}</p>
              <p>End: {a.end}</p>
            </div>
          );
        })}
      </div>
      <p className="explain-small">
        Association uses stored timestamps within 0.05 s to allow numerical event/display precision.
        Unmatched endpoints remain unattributed; no new event is solved.
      </p>
    </section>
  );
}

export function ExplanationExplorer({ manifest }: { manifest: ExplainManifest }) {
  const params = useSearchParams();
  const siteId = params.get('site') || 'dGR101',
    comparisonId =
      params.get('comparison') || (siteId === 'dGR203' ? 'time_12h' : defaultComparison);
  const metricParam = params.get('metric') || 'simultaneous';
  const metric = (['sun', 'earth', 'simultaneous'] as const).find((m) => m === metricParam);
  const site = manifest.factor_sites.find((s) => s.id === siteId),
    mapping = manifest.pairs[`${siteId}:${comparisonId}`];
  const valid = Boolean(site && mapping && metric);
  const [records, setRecords] = useState<Record<string, FactorRecord>>({}),
    [models, setModels] = useState<Record<string, ExplainModel>>({});
  const [factorError, setFactorError] = useState<string | null>(null),
    [modelError, setModelError] = useState<string | null>(null),
    [retry, setRetry] = useState(0);
  const requestedUTC = params.get('utc');
  const [index, setIndex] = useState(() =>
    physicsIndex(
      manifest,
      requestedUTC && Number.isFinite(Date.parse(requestedUTC))
        ? requestedUTC
        : manifest.domain.default_utc,
    ),
  );
  const record = valid ? records[siteId] : undefined;
  const row = record?.comparisons.find((c) => c.id === comparisonId);
  const pair = row && metric ? row.values[metric] : undefined;
  const before = record && pair ? record.measurements[pair.before] : undefined,
    after = record && pair ? record.measurements[pair.after] : undefined;
  const scope = row && record ? record.scopes[row.scope] : undefined;
  const supported = Boolean(valid && mapping.supported);
  const keyBefore = mapping?.before || '',
    keyAfter = mapping?.after || '';
  const modelBefore = supported ? models[keyBefore] : undefined,
    modelAfter = supported ? models[keyAfter] : undefined;
  const ready = Boolean(modelBefore && modelAfter);
  const requestKey = `${keyBefore}|${keyAfter}`;
  useEffect(() => {
    if (!valid || !site || records[site.id]) return;
    let current = true;
    setFactorError(null);
    verifiedJSON<FactorRecord>(site, 'resolve.factors.site.v1')
      .then((data) => {
        if (data.site !== site.id) throw new Error('Factor identity mismatch');
        if (current) setRecords((old) => ({ ...old, [site.id]: data }));
      })
      .catch(() => {
        if (current) setFactorError(site.id);
      });
    return () => {
      current = false;
    };
  }, [valid, site, records, retry]);
  useEffect(() => {
    if (!supported || ready) return;
    let current = true;
    setModelError(null);
    Promise.all(
      [...new Set([keyBefore, keyAfter])].map(async (key) => {
        const data = await verifiedJSON<ExplainModel>(
          manifest.models[key],
          'resolve.explain.model.v1',
        );
        if (data.key !== key || data.snapshots.length !== manifest.domain.sample_count)
          throw new Error('Physical record identity mismatch');
        return data;
      }),
    )
      .then((data) => {
        if (current)
          setModels((old) => ({ ...old, ...Object.fromEntries(data.map((m) => [m.key, m])) }));
      })
      .catch(() => {
        if (current) setModelError(requestKey);
      });
    return () => {
      current = false;
    };
  }, [supported, ready, keyBefore, keyAfter, manifest, requestKey, retry]);
  const selectedUTC = physicsUTC(manifest, index),
    date = selectedUTC.slice(0, 10),
    time = selectedUTC.slice(11, 16);
  const dates = Array.from({ length: manifest.domain.sample_count / 48 }, (_, i) =>
    physicsUTC(manifest, i * 48).slice(0, 10),
  );
  const times = Array.from(
    { length: 48 },
    (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`,
  );
  const choices =
    row && record
      ? matchingComparisons(record, {
          site: siteId,
          factor: row.factor,
          metric: metric || 'simultaneous',
          observer: row.observer || 'fixed_absolute',
          domain: row.domain || 'uncensored_intersecting_registered',
          variant: row.variant,
        })
      : [];
  const nativeChoices = choices.filter((c) => native.includes(c.variant)),
    nativeIndex = row ? nativeChoices.findIndex((c) => c.id === row.id) : -1;
  function choose(c: Comparison) {
    const next = new URLSearchParams(window.location.search);
    next.set('site', siteId);
    next.set('comparison', c.id);
    next.set('utc', physicsUTC(manifest, index));
    window.history.replaceState(null, '', `/explain/?${next.toString()}`);
  }
  const back = row
    ? `/factors/?${new URLSearchParams({ site: siteId, factor: row.factor, metric: metric || 'simultaneous', comparison: row.id, representation: row.variant, observer: row.observer || 'fixed_absolute', domain: row.domain || 'uncensored_intersecting_registered' }).toString()}`
    : '/factors/';
  const change = pair ? formatEffect(pair.deltaDays) : '';
  return (
    <>
      <a href="#explain-main" className="skip-link">
        Skip to physical explanation
      </a>
      <SiteHeader active="audit" context="Physical explanation" />
      <main id="explain-main" className="explain-main">
        <div className="explain-intro">
          <a className="workspace-back" href={back}>
            ← Matching factor comparison
          </a>
          <p className="eyebrow">Trace the mechanism</p>
          <h1>What changed in the physical model?</h1>
          <p>
            Connect the selected comparison to stored geometry, observer definitions and source
            events. Each explanation keeps the scope of its own study.
          </p>
        </div>
        {!valid && (
          <div role="alert" className="explain-error">
            <p>
              The requested comparison or observable is unavailable. No physical model is
              substituted.
            </p>
            <a href="/explain/">Open the supported flagship comparison</a>
          </div>
        )}
        {valid &&
          !record &&
          (factorError === siteId ? (
            <div role="alert" className="explain-error">
              <p>The selected comparison record could not be verified. No result is shown.</p>
              <button className="secondary-button" onClick={() => setRetry((n) => n + 1)}>
                Retry comparison evidence
              </button>
            </div>
          ) : (
            <p role="status">Loading the selected comparison evidence…</p>
          ))}
        {valid && record && row && pair && before && after && scope && (
          <>
            <section className="explain-comparison" aria-label="Selected source comparison">
              <p className="eyebrow">
                {siteId} · {scope.experiment}
              </p>
              <h2>{row.label}</h2>
              <p className="explain-result">
                <span>
                  {fixed(before.days)} → {fixed(after.days)} days
                </span>
                <strong data-testid="explain-effect">{change}</strong>
              </p>
              <p>
                {scope.domain} · {scope.observer}
              </p>
              <p className="explain-small">{scope.qualification}</p>
              <div className="explain-comparison-controls">
                <label>
                  Paired comparison
                  <select
                    data-testid="explain-comparison-select"
                    value={row.id}
                    onChange={(e) => choose(choices.find((c) => c.id === e.target.value)!)}
                  >
                    {choices.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Observable
                  <select
                    data-testid="explain-metric"
                    value={metric}
                    onChange={(e) => {
                      const next = new URLSearchParams(window.location.search);
                      next.set('metric', e.target.value);
                      next.set('utc', physicsUTC(manifest, index));
                      window.history.replaceState(null, '', `/explain/?${next.toString()}`);
                    }}
                  >
                    <option value="simultaneous">Sun & Earth together</option>
                    <option value="sun">Sun only</option>
                    <option value="earth">Earth only</option>
                  </select>
                </label>
              </div>
              {supported && row.factor === 'terrain' && (
                <label className="explain-product-step">
                  Step through stored native LOLA products
                  <input
                    aria-label="Step through stored native LOLA products"
                    type="range"
                    min="0"
                    max={nativeChoices.length - 1}
                    step="1"
                    value={Math.max(0, nativeIndex)}
                    disabled={nativeIndex < 0}
                    aria-valuetext={row.label}
                    onChange={(e) => choose(nativeChoices[Number(e.target.value)])}
                  />
                  <span>
                    {nativeIndex < 0
                      ? 'Separate product or synthetic control selected. Choose a native product in the comparison menu to step the native ladder.'
                      : 'Discrete product steps only: 5, 20, 40, 60, 80, 240 m. This is not interpolation or a proven convergence sequence.'}
                  </span>
                </label>
              )}
            </section>
            {!supported && (
              <section className="explain-context-only" data-testid="explain-context-only">
                <h2>Explanation within this study’s scope</h2>
                <p>{conceptual[row.factor]}</p>
                <p>
                  A matched physical visualization is not available for this comparison. Its
                  source-backed before/after evidence remains available in the factor audit; no
                  R-01C skyline, observer or witness is borrowed.
                </p>
                <a href={back}>Return to this exact factor comparison →</a>
              </section>
            )}
            {supported && (
              <section className="explain-clock" aria-label="Stored common-clock snapshots">
                <h2>Compare both models at one UTC time</h2>
                <p>
                  Stored geometry every 30 minutes, 6–30 November 2026 UTC. Refined event times
                  remain separate.
                </p>
                <div className="explain-comparison-controls">
                  <label>
                    UTC date
                    <select
                      data-testid="explain-date"
                      value={date}
                      onChange={(e) =>
                        setIndex(physicsIndex(manifest, `${e.target.value}T${time}:00.000Z`))
                      }
                    >
                      {dates.map((d) => (
                        <option key={d} value={d}>
                          {utc(`${d}T00:00:00Z`)} 2026
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    UTC time
                    <select
                      data-testid="explain-time"
                      value={time}
                      onChange={(e) =>
                        setIndex(physicsIndex(manifest, `${date}T${e.target.value}:00.000Z`))
                      }
                    >
                      {times.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="explain-time-step">
                  Move through stored snapshots
                  <input
                    type="range"
                    min="0"
                    max={manifest.domain.sample_count - 1}
                    value={index}
                    onChange={(e) => setIndex(Number(e.target.value))}
                    aria-valuetext={`${utc(selectedUTC, true)} UTC`}
                  />
                </label>
                <div className="explain-clock-step">
                  <button
                    className="text-button"
                    disabled={index === 0}
                    onClick={() => setIndex((i) => i - 1)}
                  >
                    ← Previous 30 min
                  </button>
                  <output data-testid="explain-utc" aria-live="polite">
                    {utc(selectedUTC, true)} UTC
                  </output>
                  <button
                    className="text-button"
                    disabled={index === manifest.domain.sample_count - 1}
                    onClick={() => setIndex((i) => i + 1)}
                  >
                    Next 30 min →
                  </button>
                </div>
              </section>
            )}
            {supported &&
              !ready &&
              (modelError === requestKey ? (
                <div role="alert" className="explain-error">
                  <p>
                    The selected physical records could not be verified. No previous comparison’s
                    horizon is shown.
                  </p>
                  <button className="secondary-button" onClick={() => setRetry((n) => n + 1)}>
                    Retry physical evidence
                  </button>
                </div>
              ) : (
                <p role="status">Loading the selected paired physical records…</p>
              ))}
            {supported && ready && modelBefore && modelAfter && (
              <section
                aria-label="Matched physical explanation"
                data-testid="matched-physical-explanation"
              >
                <div className="explain-physical-state">
                  <p>
                    Before:{' '}
                    {modelBefore.snapshots[index][10]
                      ? 'Sun and Earth both above the modeled horizon'
                      : 'Sun and Earth not both above the modeled horizon'}
                  </p>
                  <p>
                    After:{' '}
                    {modelAfter.snapshots[index][10]
                      ? 'Sun and Earth both above the modeled horizon'
                      : 'Sun and Earth not both above the modeled horizon'}
                  </p>
                </div>
                {row.factor === 'domain' && (
                  <p className="explain-policy-note" data-testid="explain-policy-note">
                    The physical terrain and observer are identical. Changing the reporting boundary
                    does not change the physical visibility shown here.
                    {Date.parse(selectedUTC) >= Date.parse('2026-11-28T00:00:00Z')
                      ? ' The selected snapshot is beyond the registered Nov 28 cutoff; that cutoff is not a physical set event.'
                      : ''}
                    {Date.parse(before.end.value) <= Date.parse(after.start.value) ||
                    Date.parse(after.end.value) <= Date.parse(before.start.value)
                      ? ' The longest-interval statistic selects different episodes in this observable.'
                      : ''}
                  </p>
                )}
                {row.factor === 'temporal' && (
                  <p className="explain-policy-note">
                    Both sides use the same refined terrain and observer. The duration comparison
                    changes numerical discovery cadence, not the physical skyline. Thirty-minute
                    display snapshots cannot resolve millisecond event-refinement differences.
                  </p>
                )}
                {row.badge === 'Reference only' && (
                  <p className="explain-policy-note">
                    The same reference model is selected on both sides. This is not a test of an
                    alternative representation.
                  </p>
                )}
                <CommonClockSky
                  before={modelBefore}
                  after={modelAfter}
                  index={index}
                  manifest={manifest}
                />
                <ObserverDatum before={modelBefore} after={modelAfter} />
                <EndpointAttribution
                  before={before}
                  after={after}
                  modelBefore={modelBefore}
                  modelAfter={modelAfter}
                />
                <EventWitnesses before={modelBefore} after={modelAfter} onJump={setIndex} />
                {modelBefore.key === 'P78_5m_fixed_absolute' &&
                  modelAfter.key === 'P90_80m_fixed_absolute' && (
                    <p className="explain-policy-note">
                      At the stored aligned {fixed(manifest.aligned_finding.alignedRange.value, 0)}{' '}
                      m position, the 80 m representation models the surface approximately{' '}
                      {fixed(Math.abs(manifest.aligned_finding.aligned80Minus5Height.value))} m
                      lower. This frozen finding explains a modeled near-field change; it does not
                      establish that a real ridge disappears.
                    </p>
                  )}
                <FrozenSections before={modelBefore} after={modelAfter} manifest={manifest} />
              </section>
            )}
            <IntervalEvidence
              before={before}
              after={after}
              index={index}
              manifest={manifest}
              supported={supported}
            />
            <details className="explain-provenance">
              <summary>Sources, exact records & interpretation limits</summary>
              <p>
                {scope.coordinates}
                <br />
                {scope.semantics}
              </p>
              <p>
                Factor comparison: {row.id}. The before/after durations retain their exact source
                references in the factor record.
              </p>
              <p>
                <a href={site!.href} download>
                  Download selected factor evidence
                </a>{' '}
                ·{' '}
                <a href="/evidence/explain/manifest.v1.json" download>
                  Download physical-source manifest
                </a>
              </p>
              {supported && (
                <p>
                  <a href={manifest.models[keyBefore].href} download>
                    Download before physical record
                  </a>{' '}
                  ·{' '}
                  <a href={manifest.models[keyAfter].href} download>
                    Download after physical record
                  </a>
                </p>
              )}
              <ul>
                {manifest.limitations.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
              <p>
                The new product records precompute geometric directions and clearances through
                existing verified functions; frozen horizons and interval solutions remain
                unchanged. No terrain or event solver is run in this browser.
              </p>
            </details>
            <p className="explain-return">
              <a href={back}>Return to the exact factor comparison →</a>
            </p>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
