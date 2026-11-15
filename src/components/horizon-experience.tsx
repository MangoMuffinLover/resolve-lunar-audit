'use client';
import { useEffect, useState, useRef } from 'react';
import type {
  AuditData,
  AuditCase,
  Representation,
  Observer,
  Skyline,
  TerrainSections,
  Witness,
} from '@/lib/contract';
import { caseKey } from '@/lib/contract';
import { distance, fixed, linePath, signed, utc } from '@/lib/format';

interface Bundle {
  key: string;
  reference: Skyline;
  selected: Skyline;
  referenceSections: TerrainSections;
  selectedSections: TerrainSections;
}
const records = new Map<string, Promise<unknown>>();
function loadRecord(url: string): Promise<unknown> {
  let request = records.get(url);
  if (!request) {
    request = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('Frozen record could not be loaded');
        return r.json();
      })
      .catch((e) => {
        records.delete(url);
        throw e;
      });
    records.set(url, request);
  }
  return request;
}
function WitnessCard({
  title,
  witness,
  reference = false,
}: {
  title: string;
  witness: Witness;
  reference?: boolean;
}) {
  return (
    <div className={`witness-card ${reference ? 'reference' : ''}`}>
      <span className="eyebrow">{reference ? 'Reference witness' : 'Selected witness'}</span>
      <h4>{title}</h4>
      <div className="witness-distance">{distance(witness.surface_range_m.value)}</div>
      <dl>
        <dt>Onset Sun azimuth</dt>
        <dd>{fixed(witness.target_azimuth_deg.value, 4)}°</dd>
        <dt>Lower bracketing ray</dt>
        <dd>{fixed(witness.azimuth_deg.value, 2)}°</dd>
        <dt>Solar onset · UTC</dt>
        <dd>{utc(witness.time_utc.value, true)}</dd>
      </dl>
      <p>
        Controlling sampled terrain point on the lower bracketing horizon ray at this
        representation’s late solar onset.
      </p>
    </div>
  );
}
export default function HorizonExperience({
  data,
  result,
  model,
  observer,
  onReady,
}: {
  data: AuditData;
  result: AuditCase;
  model: Representation;
  observer: Observer;
  onReady: () => void;
}) {
  const [bundle, setBundle] = useState<Bundle | null>(null),
    [error, setError] = useState(false);
  const [sector, setSector] = useState('nominal_5m_critical');
  const plotRef = useRef<HTMLDivElement>(null);
  const [plotWidth, setPlotWidth] = useState(960);
  useEffect(() => {
    const element = plotRef.current;
    if (!element) return;
    const resize = new ResizeObserver((entries) =>
      setPlotWidth(Math.max(280, Math.round(entries[0].contentRect.width))),
    );
    resize.observe(element);
    return () => resize.disconnect();
  }, []);
  const requestKey = `${model.id}_${observer}`;
  useEffect(() => {
    let current = true;
    setError(false);
    const urls = [
      data.profileFiles[`P78_5m_${observer}`].url,
      data.profileFiles[requestKey].url,
      data.sectionFiles.P78_5m.url,
      data.sectionFiles[model.id].url,
    ];
    Promise.all(urls.map(loadRecord))
      .then(([reference, selected, referenceSections, selectedSections]) => {
        const r = reference as Skyline,
          s = selected as Skyline,
          rs = referenceSections as TerrainSections,
          ss = selectedSections as TerrainSections;
        if (
          r.schema !== 'resolve.skyline.v1' ||
          s.schema !== 'resolve.skyline.v1' ||
          r.id !== 'P78_5m' ||
          s.id !== model.id ||
          r.observer !== observer ||
          s.observer !== observer ||
          rs.schema !== 'resolve.sections.v1' ||
          ss.id !== model.id
        )
          throw new Error('Frozen record identity mismatch');
        if (current)
          setBundle({
            key: requestKey,
            reference: r,
            selected: s,
            referenceSections: rs,
            selectedSections: ss,
          });
      })
      .catch(() => {
        if (current) setError(true);
      });
    return () => {
      current = false;
    };
  }, [data, model.id, observer, requestKey]);
  const referenceResult = data.cases[caseKey('P78_5m', observer, result.domain)];
  const referenceWitness = data.witnesses.find(
    (w) => w.id === 'P78_5m' && w.observer === observer && w.diagnostic === 'own_late_solar_onset',
  )!;
  const witness = data.witnesses.find(
    (w) => w.id === model.id && w.observer === observer && w.diagnostic === 'own_late_solar_onset',
  )!;
  const differentOnset = witness.time_utc.value !== referenceWitness.time_utc.value;
  const compactDistance = (metres: number) =>
    metres >= 1000 ? `≈${fixed(metres / 1000)} km` : `≈${fixed(metres, 0)} m`;
  const sun = data.witnesses.find(
    (w) =>
      w.id === 'P78_5m' &&
      w.observer === observer &&
      w.diagnostic === 'nominal5m_late_solar_onset_time',
  )!;
  const ready = bundle?.key === requestKey;
  useEffect(() => {
    if (ready || error) onReady();
  }, [ready, error, onReady]);
  const plotRight = plotWidth - 24;
  const x = (v: number) => 52 + ((v - 40) / 130) * (plotRight - 52);
  const [lo, hi] = data.plotDomains.elevation;
  const y = (v: number) => 270 - ((v - lo) / (hi - lo)) * 220;
  const ticks = Array.from({ length: (hi - lo) / 2 + 1 }, (_, i) => lo + i * 2);
  const refSection = ready
    ? bundle.referenceSections.sections.find((s) => s.direction === sector)
    : undefined;
  const selSection = ready
    ? bundle.selectedSections.sections.find((s) => s.direction === sector)
    : undefined;
  const sectionMax = sector === 'nominal_5m_critical' ? 200 : 3000;
  const heights = [
    ...(refSection?.samples.map((p) => p[1]) || []),
    ...(selSection?.samples.map((p) => p[1]) || []),
    referenceResult.absoluteHeight.value,
    result.absoluteHeight.value,
  ];
  const minHeight = Math.floor(Math.min(...heights)) - 1,
    maxHeight = Math.ceil(Math.max(...heights)) + 1;
  const sx = (v: number) => 62 + (v / sectionMax) * (plotRight - 62),
    sy = (v: number) => 245 - ((v - minHeight) / (maxHeight - minHeight)) * 195;
  return (
    <div className="horizon-experience">
      <div className="mechanism-summary" data-testid="mechanism-summary">
        <div>
          <p>Controlling modeled terrain</p>
          <strong>
            {compactDistance(referenceWitness.surface_range_m.value)} →{' '}
            {compactDistance(witness.surface_range_m.value)}
          </strong>
          <span>P78 reference → {model.label}</span>
        </div>
        <p>
          {model.id === 'P90_80m' && observer === 'fixed_absolute'
            ? 'The 80 m representation lowers the modeled near-field rise and shifts the controlling horizon farther away. '
            : 'The skylines show how the evaluated representations compare. '}
          Distances refer to each model’s own solar onset
          {differentOnset ? ', at different times and azimuths' : ''}. The skylines below are
          compared with one fixed reference Sun position.
        </p>
      </div>
      {observer === 'each_surface_2m' && (
        <p className="chart-note">
          This alternative changes absolute observer elevation between products. The Sun circle
          remains the nominal P78 reference indicator; it is not a recalculated Sun position for the
          selected observer. Each skyline and result uses its own stored observer definition.
        </p>
      )}

      <div className="horizon-legend">
        <span>
          <i className="legend-line dashed" />
          P78 SL2 5 m · reference
        </span>
        <span>
          <i className="legend-line" />
          {model.label}
        </span>
        <span>
          <i className="legend-sun" />
          Sun · fixed reference time
        </span>
        <span>
          <i className="legend-witness" />
          Selected model’s own onset{differentOnset ? ' · different time' : ''}
        </span>
      </div>
      <div className="horizon-chart-panel">
        <div className="chart-topline">
          <span className="eyebrow">Skyline as seen by the observer</span>
          <span className="mono">AZIMUTH / ELEVATION</span>
        </div>
        <p className="skyline-axis-title">Horizon elevation (°)</p>
        <div ref={plotRef}>
          {error ? (
            <div className="profile-error" role="status">
              <p>
                The interactive records could not be loaded. This frozen reference figure shows the
                fixed-absolute-observer comparison; it does not follow the controls.
              </p>
              <a href={data.sources.horizonFigure.href} target="_blank" rel="noreferrer">
                <img
                  src={data.sources.horizonFigure.href}
                  alt="Frozen R-01C critical horizon profiles, fixed absolute observer"
                  width="1100"
                  height="620"
                />
              </a>
            </div>
          ) : !ready ? (
            <div className="loading-profile" role="status">
              Loading the selected frozen profile…
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${plotWidth} 335`}
              role="img"
              aria-labelledby="skyline-title"
              aria-describedby="skyline-desc"
              className="skyline-svg"
              data-testid="horizon-plot"
            >
              <title id="skyline-title">
                Frozen horizon comparison: P78 SL2 5 m and {model.label}
              </title>
              <desc id="skyline-desc">
                Azimuth 40 to 170 degrees. Dashed reference skyline and solid selected skyline. The
                Sun circle uses the unchanged nominal onset reference time. A diamond marks the
                lower ray controlling the selected representation’s own onset at a different time.
                Exact horizon and witness values follow the chart.
              </desc>
              <defs>
                <clipPath id="skyline-clip">
                  <rect x="52" y="38" width={plotRight - 52} height="232" />
                </clipPath>
              </defs>
              {ticks.map((v) => (
                <g key={v}>
                  <line x1="52" x2={plotRight} y1={y(v)} y2={y(v)} className="plot-grid" />
                  <text x="40" y={y(v) + 4} textAnchor="end" className="plot-label">
                    {fixed(v, 1)}°
                  </text>
                </g>
              ))}
              {(plotWidth < 550
                ? [40, 70, 100, 130, 170]
                : [40, 60, 80, 100, 120, 140, 160, 170]
              ).map((v) => (
                <g key={v}>
                  <line x1={x(v)} x2={x(v)} y1="38" y2="270" className="plot-grid vertical" />
                  <text x={x(v)} y="294" textAnchor="middle" className="plot-label">
                    {v}°
                  </text>
                </g>
              ))}
              <g clipPath="url(#skyline-clip)">
                <path d={linePath(bundle.selected.rays, x, y)} className="selected-skyline" />
                <path d={linePath(bundle.reference.rays, x, y)} className="reference-skyline" />
                <line
                  x1={x(sun.target_azimuth_deg.value)}
                  x2={x(sun.target_azimuth_deg.value)}
                  y1="38"
                  y2="270"
                  className="sun-reference-line"
                />
                <circle
                  cx={x(sun.target_azimuth_deg.value)}
                  cy={y(sun.target_elevation_deg.value)}
                  r="7"
                  className="sun-marker"
                />
                <path
                  d={`M${x(witness.azimuth_deg.value)},${y(witness.horizon_elevation_deg.value) - 6}l6 6-6 6-6-6z`}
                  className="witness-marker"
                />
                <line
                  x1={x(sun.target_azimuth_deg.value)}
                  x2={x(sun.target_azimuth_deg.value)}
                  y1={y(referenceResult.nominalHorizon.value)}
                  y2={y(result.nominalHorizon.value)}
                  className="horizon-gap"
                />
              </g>
              <text
                x={Math.min(plotWidth - 145, x(sun.target_azimuth_deg.value) + 14)}
                y="24"
                className="sun-text"
              >
                Fixed reference Sun
              </text>
              <text x={plotWidth / 2} y="325" textAnchor="middle" className="plot-label">
                Azimuth clockwise from north
              </text>
            </svg>
          )}
        </div>
        <div className="chart-caption">
          <span>
            <span className="observer-symbol" aria-hidden="true">
              ⊙
            </span>{' '}
            Observer:{' '}
            {observer === 'fixed_absolute'
              ? 'fixed absolute elevation'
              : '2 m above each represented surface'}
          </span>
          <span>Reference Sun · {utc(sun.time_utc.value, true)} UTC</span>
        </div>
      </div>
      <p className="skyline-reading">
        <strong>At this same reference sector:</strong>{' '}
        {model.id === 'P78_5m'
          ? 'The reference and selected skylines coincide.'
          : `${model.label} models a ${result.nominalHorizon.value < referenceResult.nominalHorizon.value ? 'lower' : result.nominalHorizon.value > referenceResult.nominalHorizon.value ? 'higher' : 'matching'} horizon.`}{' '}
        The diamond marks the selected model’s own onset witness
        {differentOnset ? ' at a different time' : ''}.
      </p>
      <p className="common-clock-entry">
        <a
          className="text-button"
          href={`/explain/?${new URLSearchParams({ site: 'dGR101', comparison: `terrain-${model.id}-${observer}-${result.domain}`, metric: 'simultaneous' }).toString()}`}
        >
          Explore this pair at a common Sun/Earth time →
        </a>
      </p>
      <div className="horizon-explanation">
        <div>
          <h3>At the same nominal onset sector</h3>
          <p>
            Azimuth {fixed(sun.target_azimuth_deg.value, 4)}°. The Sun marker stays at the stored
            nominal reference time when the terrain selection changes.
          </p>
        </div>
        <dl className="horizon-numbers">
          <div>
            <dt>P78 reference horizon</dt>
            <dd>{signed(referenceResult.nominalHorizon.value)}°</dd>
          </div>
          <div>
            <dt>{model.label} horizon</dt>
            <dd data-testid="selected-horizon">{signed(result.nominalHorizon.value)}°</dd>
          </div>
        </dl>
      </div>
      {model.id === 'P90_80m' && observer === 'fixed_absolute' && (
        <p className="mechanism-callout">
          At the aligned {fixed(data.reportedComparisons.alignedRange.value, 0)} m position, the 80
          m representation models the surface approximately{' '}
          {fixed(Math.abs(data.reportedComparisons.aligned80Minus5Height.value))} m lower than
          nominal 5 m. The evaluated coarse representation lowers the modeled near-field rise and
          shifts the controlling horizon farther away.
        </p>
      )}
      <details className="terrain-section">
        <summary>Inspect the frozen terrain cross-section</summary>
        <div className="section-controls" role="group" aria-label="Cross-section direction">
          <button
            aria-pressed={sector === 'nominal_5m_critical'}
            onClick={() => setSector('nominal_5m_critical')}
          >
            Nominal 5 m onset sector
          </button>
          <button
            aria-pressed={sector === 'native_80m_critical'}
            onClick={() => setSector('native_80m_critical')}
          >
            Native 80 m onset sector
          </button>
        </div>
        <p>
          Stored surface heights along azimuth{' '}
          {refSection ? fixed(refSection.azimuth.value, 4) : '…'}°. Observer markers use the
          selected convention. Surface heights are shared between observer definitions; sight lines
          are not recalculated.
        </p>
        {ready && refSection && selSection && (
          <svg
            viewBox={`0 0 ${plotWidth} 305`}
            role="img"
            aria-label={`Frozen terrain heights along ${fixed(refSection.azimuth.value, 4)} degrees; dashed reference and solid selected representation. Observer elevations marked at zero range.`}
            className="terrain-svg"
            data-testid="terrain-plot"
          >
            {[minHeight, (minHeight + maxHeight) / 2, maxHeight].map((v) => (
              <g key={v}>
                <line x1="62" x2={plotRight} y1={sy(v)} y2={sy(v)} className="plot-grid" />
                <text x="50" y={sy(v) + 4} textAnchor="end" className="plot-label">
                  {fixed(v, 1)}
                </text>
              </g>
            ))}
            <path d={linePath(selSection.samples, sx, sy)} className="selected-skyline" />
            <path d={linePath(refSection.samples, sx, sy)} className="reference-skyline" />
            <circle
              cx={sx(0)}
              cy={sy(referenceResult.absoluteHeight.value)}
              r="6"
              className="reference-observer"
            />
            <rect
              x={sx(0) - 4}
              y={sy(result.absoluteHeight.value) - 4}
              width="8"
              height="8"
              className="witness-marker"
            />
            {[0, sectionMax / 4, sectionMax / 2, (3 * sectionMax) / 4, sectionMax].map((v) => (
              <text key={v} x={sx(v)} y="268" textAnchor="middle" className="plot-label">
                {v}
              </text>
            ))}
            <text x={plotWidth / 2} y="295" textAnchor="middle" className="plot-label">
              Surface range from observer (m)
            </text>
            <text x="62" y="27" className="plot-label">
              {plotWidth < 550
                ? 'Elevation above reference radius (m)'
                : 'Surface / observer elevation above reference radius (m)'}
            </text>
          </svg>
        )}
        <p className="chart-note">
          Bilinear source-grid profiles copied from R-01C. Dense plotting samples do not add terrain
          knowledge. Circle = reference observer; square = selected observer.
        </p>
      </details>
      <div className="witness-grid">
        <WitnessCard title="P78 SL2 5 m" witness={referenceWitness} reference />
        <WitnessCard title={model.label} witness={witness} />
      </div>
      <p className="chart-note">
        Each onset witness belongs to its own stored solar-onset time. The selected diamond is a
        lower bracketing ray; the final horizon interpolates two rays. Witness ranges describe
        modeled terrain locations, not direct measurements.
      </p>

      <details className="chart-data">
        <summary>Text alternative · horizon and witness values</summary>
        <table>
          <caption>Frozen results for the current observer convention</caption>
          <thead>
            <tr>
              <th>Representation</th>
              <th>Horizon at reference sector</th>
              <th>Own onset azimuth</th>
              <th>Witness range</th>
            </tr>
          </thead>
          <tbody>
            {[
              [referenceResult, referenceWitness, 'P78 SL2 5 m'],
              [result, witness, model.label],
            ].map(([r, w, label], i) => {
              const c = r as AuditCase,
                v = w as Witness;
              return (
                <tr key={i}>
                  <th>{label as string}</th>
                  <td>{c.nominalHorizon.original}°</td>
                  <td>{v.target_azimuth_deg.original}°</td>
                  <td>{v.surface_range_m.original} m</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p>
          Raw skyline samples with original indices:{' '}
          <a href={data.profileFiles[requestKey].url} target="_blank" rel="noreferrer">
            selected profile JSON ↗
          </a>
          . Frozen height samples:{' '}
          <a href={data.sectionFiles[model.id].url} target="_blank" rel="noreferrer">
            selected sections JSON ↗
          </a>
          .
        </p>
      </details>
      <div className="support-panel">
        <div>
          <span className="eyebrow">Data behind the nominal witness</span>
          <h3>What supports this terrain point?</h3>
          <p>
            Nearest source fields at the nominal P78 5 m critical witness. These are descriptive
            data-support values, not calibrated confidence.
          </p>
        </div>
        <dl>
          {data.support.map((s) => (
            <div key={s.id}>
              <dt>{s.label}</dt>
              <dd>
                {fixed(s.datum.value, s.digits)}{' '}
                <small>{s.datum.unit === 'count' ? '' : s.datum.unit}</small>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
