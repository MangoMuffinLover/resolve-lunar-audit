'use client';
import { useEffect, useRef, useState } from 'react';
import type { AuditData, TerrainSections } from '@/lib/contract';
import type { VisualAssets } from '@/lib/visual-contract';
import { verifiedJSON } from '@/lib/verified-json';
import { distance, signed, utc } from '@/lib/format';
import { TerrainStudy } from './terrain-study';

export function PhysicalReveal({ data, visual }: { data: AuditData; visual: VisualAssets }) {
  const [step, setStep] = useState(0);
  const plot = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(940);
  const [sections, setSections] = useState<TerrainSections[] | null>(null),
    [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all(
      ['P78_5m', 'P90_80m'].map((id) =>
        verifiedJSON<TerrainSections>(visual.sections[id], 'resolve.sections.v1'),
      ),
    )
      .then((value) => {
        if (active) setSections(value);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [visual]);
  useEffect(() => {
    if (!sections || !plot.current) return;
    const node = plot.current;
    const measure = () => setWidth(Math.round(node.clientWidth));
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(node);
    return () => resize.disconnect();
  }, [sections]);
  const ids = ['P78_5m', 'P90_80m'];
  const witnesses = ids.map((id) =>
    data.witnesses.find(
      (w) =>
        w.id === id && w.observer === 'fixed_absolute' && w.diagnostic === 'own_late_solar_onset',
    )!,
  );
  const x = (range: number) => 50 + (range / 200) * (width - 80),
    y = (height: number) => 300 - ((height - 1520) / 20) * 250;
  return (
    <div className="physical-reveal" data-testid="physical-reveal" data-story>
      <div className="physics-intro">
        <p className="eyebrow">The near field changes the answer</p>
        <h3>
          A nearby rise.
          <br />
          <em>A different represented skyline.</em>
        </h3>
        <p>
          In the evaluated 5 m representation, nearby terrain controls solar onset. The 80 m
          representation places the near-field rise lower.
        </p>
      </div>
      <div className="physics-step-controls" role="group" aria-label="Physical explanation steps">
        <p className="interaction-instruction">
          Choose each step when you are ready. Every view holds for reading.
        </p>
        <div>
          <button aria-pressed={step === 0} onClick={() => setStep(0)}>
            1. Inspect the 5 m profile
          </button>
          <button aria-pressed={step === 1} onClick={() => setStep(1)}>
            2. Compare the 80 m profile
          </button>
          <button aria-pressed={step === 2} onClick={() => setStep(2)}>
            3. Locate event witnesses
          </button>
        </div>
        <p role="status">
          {step === 0
            ? 'The reference profile is shown. Compare the 80 m representation when you are ready.'
            : step === 1
              ? 'At the aligned 49 m location, the 80 m representation places the terrain 1.647339 m lower.'
              : 'Two controlling terrain witnesses, each at its own event time and azimuth.'}
        </p>
      </div>
      {sections ? (
        <figure className="near-field-figure">
          <div className="profile-legend">
            <span>Dashed / P78 · 5 m</span>
            <span>{step > 0 ? 'Solid / P90 · 80 m' : 'P90 · 80 m waits for step 2'}</span>
            <span>Same nominal-onset azimuth</span>
          </div>
          <svg
            ref={plot}
            viewBox={`0 0 ${width} 360`}
            role="img"
            aria-label={
              step === 0
                ? 'Frozen 5 metre reference profile at its nominal onset azimuth, with radial heights above the reference sphere'
                : 'Frozen near-field terrain cross-sections at the nominal 5 metre onset azimuth, with radial heights above the reference sphere'
            }
            data-testid="near-field-profile"
          >
            {[1520, 1525, 1530, 1535, 1540].map((h) => (
              <g key={h}>
                <line x1="50" x2={width - 30} y1={y(h)} y2={y(h)} className="profile-grid" />
                <text x="40" y={y(h) + 4} textAnchor="end">
                  {h}
                </text>
              </g>
            ))}
            {[0, 50, 100, 150, 200].map((r) => (
              <text key={r} x={x(r)} y="325" textAnchor="middle">
                {r} m
              </text>
            ))}
            {sections.map((record, i) => (
              <path
                key={`${record.id}-${step}`}
                d={record.sections
                  .find((s) => s.direction === 'nominal_5m_critical')!
                  .samples.map(
                    ([r, h], j) => `${j ? 'L' : 'M'}${x(r).toFixed(2)},${y(h).toFixed(2)}`,
                  )
                  .join('')}
                className={i ? 'profile-selected' : 'profile-reference'}
                pathLength={i ? 1 : undefined}
                style={i && step === 0 ? { visibility: 'hidden' } : undefined}
              />
            ))}
            <line
              x1={x(data.reportedComparisons.alignedRange.value)}
              x2={x(data.reportedComparisons.alignedRange.value)}
              y1="30"
              y2="300"
              className="profile-probe"
            />
            <text x={x(data.reportedComparisons.alignedRange.value) + 12} y="30">
              49 m aligned location
            </text>
            <text x={width / 2} y="352" textAnchor="middle">
              {width < 600
                ? 'Surface range (m)'
                : 'Surface range / radial height above reference sphere (m)'}
            </text>
          </svg>
          <figcaption>
            Frozen samples at {witnesses[0].target_azimuth_deg.value.toFixed(4)}° azimuth. At the
            aligned {data.reportedComparisons.alignedRange.original} m location, P90 80 m is
            represented {Math.abs(data.reportedComparisons.aligned80Minus5Height.value).toFixed(6)}{' '}
            m lower. This is a radial-height cross-section; axes have different scales.
          </figcaption>
        </figure>
      ) : (
        <p role={error ? 'alert' : 'status'}>
          {error
            ? 'The verified cross-section could not be loaded. The source figures remain available in the detailed evidence.'
            : 'Verifying the frozen near-field profiles…'}
        </p>
      )}
      {step > 0 && (
        <div className="physics-horizon-values" key="horizon-values">
          <p>
            <span>AT THE NOMINAL 5 M ONSET SECTOR</span>
            <strong>
              {signed(
                data.cases['P78_5m:fixed_absolute:uncensored_intersecting_registered']
                  .nominalHorizon.value,
                6,
              )}
              ° <span>→</span>{' '}
              {signed(
                data.cases['P90_80m:fixed_absolute:uncensored_intersecting_registered']
                  .nominalHorizon.value,
                6,
              )}
              °
            </strong>
          </p>
          <span>
            P78 5 m / P90 80 m<br />
            Fixed absolute observer
          </span>
        </div>
      )}
      {step === 2 && (
        <div className="witness-relocation" key="witnesses">
          <div className="witness-heading">
            <p className="eyebrow">Separate own-event witnesses</p>
            <h3>
              The controlling sampled
              <br />
              terrain is farther away.
            </h3>
            <p>
              These witnesses belong to different event times and azimuths. They are not two points
              along one simultaneous ray.
            </p>
          </div>
          <div className="ray-pair">
            {witnesses.map((w, i) => (
              <article key={w.id}>
                <span className="eyebrow">{i ? 'P90 native 80 m' : 'P78 SL2 5 m'}</span>
                <strong>{distance(w.surface_range_m.value)}</strong>
                <svg
                  viewBox="0 0 380 75"
                  role="img"
                  aria-label={`Schematic observer-to-witness connection, ${distance(w.surface_range_m.value)}; layout not to scale`}
                >
                  <circle cx="18" cy="53" r="5" />
                  <path d={i ? 'M18,53L350,18' : 'M18,53L160,18'} className="witness-ray" />
                  <path
                    d={i ? 'M350,10V26M342,18H358' : 'M160,10V26M152,18H168'}
                    className="witness-target"
                  />
                  <text x="14" y="72">
                    Observer
                  </text>
                </svg>
                <p>
                  {w.target_azimuth_deg.value.toFixed(4)}° azimuth
                  <br />
                  {utc(w.time_utc.value, true)} UTC
                </p>
                <small>Lower bracketing ray · schematic layout, not to scale</small>
              </article>
            ))}
          </div>
        </div>
      )}
      <p className="physics-limit">
        The 80 m own-event witness is about 2 km away. The shared-azimuth near-field comparison and
        the two own-event witnesses are complementary diagnostics; neither establishes terrain
        truth.
      </p>
      <TerrainStudy />
    </div>
  );
}
