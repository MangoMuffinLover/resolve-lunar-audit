'use client';
import { useEffect, useRef, useState } from 'react';
import type {
  ExplainManifest,
  ExplainModel,
  PhysicsSample,
  TerrainSections,
  WitnessEvent,
} from '@/lib/explanation-contract';
import { physicsUTC } from '@/lib/explanation-contract';
import { verifiedJSON } from '@/lib/verified-json';
import { distance, fixed, linePath, signed, utc } from '@/lib/format';

function trajectory(
  samples: PhysicsSample[],
  start: number,
  end: number,
  offset: number,
  x: (v: number) => number,
  y: (v: number) => number,
  lo: number,
  hi: number,
) {
  let path = '',
    previous: number | null = null;
  for (let i = start; i <= end; i++) {
    const az = Number(samples[i][offset]),
      el = Number(samples[i][offset + 1]);
    if (az < lo || az > hi) {
      previous = null;
      continue;
    }
    path += `${previous === null || Math.abs(az - previous) > 180 ? 'M' : 'L'}${x(az).toFixed(2)},${y(el).toFixed(2)}`;
    previous = az;
  }
  return path;
}

export function CommonClockSky({
  before,
  after,
  index,
  manifest,
  showMeasurements = true,
  fit = false,
}: {
  before: ExplainModel;
  after: ExplainModel;
  index: number;
  manifest: Pick<ExplainManifest, 'domain' | 'plot'>;
  showMeasurements?: boolean;
  fit?: boolean;
}) {
  const plotRef = useRef<HTMLDivElement>(null);
  const [plotWidth, setPlotWidth] = useState(920);
  useEffect(() => {
    if (!fit || !plotRef.current) return;
    const element = plotRef.current;
    const measure = () => setPlotWidth(Math.min(920, Math.max(180, element.clientWidth)));
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    return () => resize.disconnect();
  }, [fit]);
  const narrow = fit && plotWidth < 550;
  const left = narrow ? 40 : 60,
    right = plotWidth - (narrow ? 15 : 60);
  const [full, setFull] = useState(false),
    [paths, setPaths] = useState(false);
  const [lo, hi] = full ? manifest.plot.full_sector : manifest.plot.solar_sector;
  const [bottom, top] = manifest.plot.elevation;
  const x = (az: number) => left + ((az - lo) / (hi - lo)) * (right - left),
    y = (el: number) => 290 - ((el - bottom) / (top - bottom)) * 240;
  const a = before.snapshots[index],
    b = after.snapshots[index];
  const common = [0, 1, 5, 6].every((i) => a[i] === b[i]);
  const ticks = full
    ? [0, 90, 180, 270, 360]
    : narrow
      ? [40, 80, 120, 170]
      : [40, 60, 80, 100, 120, 140, 160, 170];
  const inside = (az: number) => az >= lo && az <= hi;
  return (
    <figure className="explain-sky">
      <h2>Same clock, paired skylines</h2>
      <p>
        {common
          ? 'The observer position and Sun/Earth centers are identical in both records.'
          : 'The ephemeris is the same; the observer positions differ. Both recorded body positions are shown.'}
      </p>
      <div className="explain-plot-controls">
        <label>
          <input type="checkbox" checked={full} onChange={(e) => setFull(e.target.checked)} /> Full
          360° horizon
        </label>
        <label>
          <input type="checkbox" checked={paths} onChange={(e) => setPaths(e.target.checked)} />{' '}
          Show sampled paths ±24 h
        </label>
      </div>
      <div className="explain-legend">
        <span>Dashed: before skyline</span>
        <span>Solid: after skyline</span>
        <span>Circle: Sun center</span>
        <span>Diamond: Earth center</span>
        {!common && <span>Filled: before observer · outlined: after observer</span>}
      </div>
      <div
        ref={plotRef}
        className={`explain-plot-scroll${fit ? ' fitted-sky' : ''}${narrow ? ' fitted-sky-narrow' : ''}`}
        role="region"
        aria-label={
          fit
            ? 'Paired angular skylines'
            : 'Paired angular skylines; scroll horizontally on small screens'
        }
        tabIndex={0}
      >
        <svg
          viewBox={`0 0 ${plotWidth} 350`}
          role="img"
          aria-label={`Paired frozen skylines and stored Sun/Earth centers at ${physicsUTC(manifest, index)}`}
          data-testid="common-clock-sky"
        >
          <defs>
            <clipPath id="explain-sky-clip">
              <rect x={left} y="40" width={right - left} height="250" />
            </clipPath>
          </defs>
          <text x={left} y="22" className="plot-label">
            Elevation above local horizontal (°)
          </text>
          {[-9, -6, -3, 0, 3, 6, 9].map((el) => (
            <g key={el}>
              <line x1={left} x2={right} y1={y(el)} y2={y(el)} className="plot-grid" />
              <text x={left - 12} y={y(el) + 4} textAnchor="end" className="plot-label">
                {el}°
              </text>
            </g>
          ))}
          {ticks.map((az) => (
            <g key={az}>
              <line x1={x(az)} x2={x(az)} y1="40" y2="290" className="plot-grid vertical" />
              <text x={x(az)} y="315" textAnchor="middle" className="plot-label">
                {az}°
              </text>
            </g>
          ))}
          <g clipPath="url(#explain-sky-clip)">
            {paths && (
              <>
                <path
                  d={trajectory(
                    before.snapshots,
                    Math.max(0, index - 48),
                    Math.min(before.snapshots.length - 1, index + 48),
                    0,
                    x,
                    y,
                    lo,
                    hi,
                  )}
                  className="explain-sun-path"
                />
                <path
                  d={trajectory(
                    before.snapshots,
                    Math.max(0, index - 48),
                    Math.min(before.snapshots.length - 1, index + 48),
                    5,
                    x,
                    y,
                    lo,
                    hi,
                  )}
                  className="explain-earth-path"
                />
              </>
            )}
            <path d={linePath(before.skyline, x, y)} className="reference-skyline" />
            <path d={linePath(after.skyline, x, y)} className="selected-skyline" />
            {inside(Number(a[0])) && (
              <circle
                cx={x(Number(a[0]))}
                cy={y(Number(a[1]))}
                r="7"
                className="sun-marker"
                data-testid="explain-sun-before"
              />
            )}
            {inside(Number(a[5])) && (
              <path
                d={`M${x(Number(a[5]))},${y(Number(a[6])) - 7}l7 7-7 7-7-7z`}
                className="navigator-earth"
              />
            )}
            {!common && inside(Number(b[0])) && (
              <circle
                cx={x(Number(b[0]))}
                cy={y(Number(b[1]))}
                r="10"
                className="explain-outline-marker"
                data-testid="explain-sun-after"
              />
            )}
            {!common && inside(Number(b[5])) && (
              <path
                d={`M${x(Number(b[5]))},${y(Number(b[6])) - 10}l10 10-10 10-10-10z`}
                className="explain-outline-marker"
              />
            )}
          </g>
          <text x={plotWidth / 2} y="344" textAnchor="middle" className="plot-label">
            Azimuth clockwise from geographic north
          </text>
        </svg>
      </div>
      {(!inside(Number(a[0])) ||
        !inside(Number(a[5])) ||
        !inside(Number(b[0])) ||
        !inside(Number(b[5]))) && (
        <p className="explain-crop-note">
          A body is outside the cropped sector. Switch to the full horizon; its numerical state
          remains listed below.
        </p>
      )}
      <figcaption>
        Markers show stored centers at one common UTC snapshot, not body disc sizes.{' '}
        {paths
          ? 'Paths join stored 30-minute positions for the before observer; lines do not resolve event transitions. '
          : ''}
        Own-event witness times are shown separately below.
      </figcaption>
      {showMeasurements && (
        <div
          className="explain-numerical-scroll"
          role="region"
          aria-label="Selected snapshot angular measurements; scroll horizontally on small screens"
          tabIndex={0}
        >
          <table>
            <caption>Selected snapshot — angular comparison</caption>
            <thead>
              <tr>
                <th>Body / quantity</th>
                <th>Before</th>
                <th>After</th>
              </tr>
            </thead>
            <tbody>
              {(['Sun', 'Earth'] as const).flatMap((name, target) => {
                const offset = target * 5;
                return [
                  <tr key={name + 'az'}>
                    <th>{name} azimuth</th>
                    <td>{fixed(Number(a[offset]), 6)}°</td>
                    <td>{fixed(Number(b[offset]), 6)}°</td>
                  </tr>,
                  <tr key={name + 'el'}>
                    <th>{name} elevation</th>
                    <td>{signed(Number(a[offset + 1]), 6)}°</td>
                    <td>{signed(Number(b[offset + 1]), 6)}°</td>
                  </tr>,
                  <tr key={name + 'clear'}>
                    <th>{name} clearance</th>
                    <td>{signed(Number(a[offset + 3]), 6)}°</td>
                    <td>{signed(Number(b[offset + 3]), 6)}°</td>
                  </tr>,
                  <tr key={name + 'visible'}>
                    <th>{name} center</th>
                    <td>{a[offset + 4] ? 'Above modeled horizon' : 'Not above modeled horizon'}</td>
                    <td>{b[offset + 4] ? 'Above modeled horizon' : 'Not above modeled horizon'}</td>
                  </tr>,
                ];
              })}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}

export function ObserverDatum({ before, after }: { before: ExplainModel; after: ExplainModel }) {
  const low = Math.floor(Math.min(before.ground.value, after.ground.value)) - 1,
    high = Math.ceil(Math.max(before.absolute.value, after.absolute.value)) + 1;
  const y = (value: number) => 220 - ((value - low) / (high - low)) * 170;
  return (
    <section className="observer-datum">
      <h2>What happened to the observer?</h2>
      <p>
        {before.absolute.value === after.absolute.value
          ? 'Absolute observer elevation is held fixed. Height above each represented ground can differ.'
          : 'The modeled absolute observer elevation changes. Compare it with the represented ground, using one reference sphere.'}
      </p>
      <div
        className="explain-plot-scroll"
        role="region"
        aria-label="Source observer and ground elevation diagram; scroll horizontally on small screens"
        tabIndex={0}
      >
        <svg
          viewBox="0 0 900 280"
          role="img"
          aria-label="Before and after observer and ground elevations on a common vertical scale"
          data-testid="observer-datum-plot"
        >
          <text x="65" y="22" className="plot-label">
            Radial elevation above the same lunar reference sphere (m)
          </text>
          {[low, (low + high) / 2, high].map((v) => (
            <g key={v}>
              <line x1="65" x2="840" y1={y(v)} y2={y(v)} className="plot-grid" />
              <text x="55" y={y(v) + 4} textAnchor="end" className="plot-label">
                {fixed(v, 1)}
              </text>
            </g>
          ))}
          {[before, after].map((m, i) => {
            const cx = i ? 650 : 250;
            return (
              <g key={i}>
                <line
                  x1={cx - 105}
                  x2={cx + 105}
                  y1={y(m.ground.value)}
                  y2={y(m.ground.value)}
                  className={i ? 'selected-skyline' : 'reference-skyline'}
                />
                <line
                  x1={cx}
                  x2={cx}
                  y1={y(m.ground.value)}
                  y2={y(m.absolute.value)}
                  className="explain-observer-height"
                />
                <circle
                  cx={cx}
                  cy={y(m.absolute.value)}
                  r="7"
                  className={i ? 'explain-outline-marker' : 'reference-observer'}
                />
                <text x={cx + 18} y={y(m.absolute.value) - 10} className="plot-label">
                  Observer
                </text>
                <text x={cx} y="255" textAnchor="middle" className="plot-label">
                  {i ? 'After' : 'Before'} · {fixed(m.above_ground.value, 3)} m above ground
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="explain-small">
        This is a datum diagram. Vertical positions use stored elevations; horizontal separation is
        schematic.
      </p>
      <div
        className="explain-numerical-scroll"
        role="region"
        aria-label="Stored observer elevations; scroll horizontally on small screens"
        tabIndex={0}
      >
        <table>
          <caption>Source elevations</caption>
          <thead>
            <tr>
              <th>Quantity</th>
              <th>Before</th>
              <th>After</th>
            </tr>
          </thead>
          <tbody>
            {(
              [
                ['Ground', 'ground'],
                ['Absolute observer', 'absolute'],
                ['Above represented ground', 'above_ground'],
              ] as const
            ).map(([label, key]) => (
              <tr key={key}>
                <th>{label}</th>
                <td>{before[key].original} m</td>
                <td>{after[key].original} m</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EventCard({
  label,
  event,
  onJump,
}: {
  label: string;
  event: WitnessEvent;
  onJump: (index: number) => void;
}) {
  return (
    <div className="explain-witness-card">
      <h3>{label}</h3>
      <p>
        {event.target === 'sun' ? 'Sun' : 'Earth'} · {utc(event.at.time_utc.value, true)} UTC
      </p>
      <p>
        At that event: azimuth {fixed(event.at.target_azimuth_deg.value, 4)}° · elevation{' '}
        {signed(event.at.target_elevation_deg.value, 4)}°
      </p>
      <dl>
        {event.rays.map((ray) => (
          <div key={ray.bracket}>
            <dt>{ray.bracket === 'lower' ? 'Lower' : 'Upper'} bracketing ray</dt>
            <dd>
              {distance(ray.surface_range_m.value)} · {fixed(ray.azimuth_deg.value, 2)}°
              <span className="explain-witness-source">
                Stored source: {ray.source_product.value}
              </span>
            </dd>
          </div>
        ))}
      </dl>
      <div className="explain-jump-buttons">
        <button className="text-button" onClick={() => onJump(event.sample_before_index)}>
          Sample before event
        </button>
        <button className="text-button" onClick={() => onJump(event.sample_after_index)}>
          Sample after event
        </button>
      </div>
    </div>
  );
}
export function EventWitnesses({
  before,
  after,
  onJump,
}: {
  before: ExplainModel;
  after: ExplainModel;
  onJump: (index: number) => void;
}) {
  return (
    <section className="explain-events">
      <h2>Which terrain controls the stored events?</h2>
      <p>
        These witnesses belong to each model’s own event time, separately from the common-clock
        snapshot. The horizon interpolates two rays; ranges identify modeled sampled terrain, not
        direct measurements.
      </p>
      <h3>Late solar onset</h3>
      <div className="explain-event-grid">
        <EventCard label={`Before · ${before.label}`} event={before.solar_onset} onJump={onJump} />
        <EventCard label={`After · ${after.label}`} event={after.solar_onset} onJump={onJump} />
      </div>
      <h3>Late simultaneous-visibility end</h3>
      <div className="explain-event-grid">
        <EventCard
          label={`Before · ${before.label}`}
          event={before.simultaneous_end}
          onJump={onJump}
        />
        <EventCard
          label={`After · ${after.label}`}
          event={after.simultaneous_end}
          onJump={onJump}
        />
      </div>
      <p className="explain-small">
        Jump buttons select the neighboring stored 30-minute samples. They do not replace the
        event-refined timestamps or recompute a transition.
      </p>
    </section>
  );
}

export function FrozenSections({
  before,
  after,
  manifest,
}: {
  before: ExplainModel;
  after: ExplainModel;
  manifest: ExplainManifest;
}) {
  const [open, setOpen] = useState(false),
    [sector, setSector] = useState('nominal_5m_critical');
  const [loaded, setLoaded] = useState<Record<string, TerrainSections>>({}),
    [failed, setFailed] = useState<string | null>(null),
    [retry, setRetry] = useState(0);
  const requestKey = `${before.model}:${after.model}`;
  const a = loaded[before.model]?.sections.find((s) => s.direction === sector),
    b = loaded[after.model]?.sections.find((s) => s.direction === sector);
  useEffect(() => {
    if (!open || (a && b)) return;
    let current = true;
    setFailed(null);
    const ids = [...new Set([before.model, after.model])];
    Promise.all(
      ids.map(async (id) => {
        const data = await verifiedJSON<TerrainSections>(
          manifest.sections[id],
          'resolve.sections.v1',
        );
        if (data.id !== id) throw new Error('Section identity mismatch');
        return data;
      }),
    )
      .then((values) => {
        if (current)
          setLoaded((old) => ({
            ...old,
            ...Object.fromEntries(values.map((value) => [value.id, value])),
          }));
      })
      .catch(() => {
        if (current) setFailed(requestKey);
      });
    return () => {
      current = false;
    };
  }, [open, a, b, before.model, after.model, manifest, requestKey, retry]);
  const max = sector === 'nominal_5m_critical' ? 200 : 3000;
  const heights = [
    ...(a?.samples.map((p) => p[1]) || []),
    ...(b?.samples.map((p) => p[1]) || []),
    before.absolute.value,
    after.absolute.value,
  ];
  const lo = Math.floor(Math.min(...heights)) - 1,
    hi = Math.ceil(Math.max(...heights)) + 1;
  const x = (r: number) => 70 + (r / max) * 780,
    y = (h: number) => 240 - ((h - lo) / (hi - lo)) * 180;
  return (
    <details
      className="explain-sections"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>Inspect the saved terrain sections</summary>
      <div className="explain-plot-controls">
        <label>
          Saved sector
          <select value={sector} onChange={(e) => setSector(e.target.value)}>
            <option value="nominal_5m_critical">Nominal 5 m onset direction</option>
            <option value="native_80m_critical">Native 80 m onset direction</option>
          </select>
        </label>
      </div>
      {open &&
        (!a || !b) &&
        (failed === requestKey ? (
          <div role="alert">
            <p>The selected saved section could not be loaded. No replacement profile is drawn.</p>
            <button className="text-button" onClick={() => setRetry((n) => n + 1)}>
              Retry saved section
            </button>
          </div>
        ) : (
          <p role="status">Loading saved surface heights…</p>
        ))}
      {a && b && (
        <>
          <p>
            Stored surface heights along {fixed(a.azimuth.value, 4)}°. The before and after observer
            markers use their own stored radial elevations.
          </p>
          <div
            className="explain-plot-scroll"
            role="region"
            aria-label="Saved surface heights; scroll horizontally on small screens"
            tabIndex={0}
          >
            <svg
              viewBox="0 0 920 310"
              role="img"
              aria-label={`Frozen radial surface heights along ${a.azimuth.value} degrees`}
              data-testid="explain-terrain-section"
            >
              <text x="70" y="26" className="plot-label">
                Surface / observer radial elevation above reference radius (m)
              </text>
              {[lo, (lo + hi) / 2, hi].map((v) => (
                <g key={v}>
                  <line x1="70" x2="850" y1={y(v)} y2={y(v)} className="plot-grid" />
                  <text x="58" y={y(v) + 4} textAnchor="end" className="plot-label">
                    {fixed(v, 1)}
                  </text>
                </g>
              ))}
              <path d={linePath(a.samples, x, y)} className="reference-skyline" />
              <path d={linePath(b.samples, x, y)} className="selected-skyline" />
              <circle
                cx={x(0)}
                cy={y(before.absolute.value)}
                r="7"
                className="reference-observer"
              />
              <rect
                x={x(0) - 5}
                y={y(after.absolute.value) - 5}
                width="10"
                height="10"
                className="explain-outline-marker"
              />
              {[0, max / 4, max / 2, (max * 3) / 4, max].map((r) => (
                <text key={r} x={x(r)} y="266" textAnchor="middle" className="plot-label">
                  {r}
                </text>
              ))}
              <text x="460" y="298" textAnchor="middle" className="plot-label">
                Surface range (m)
              </text>
            </svg>
          </div>
        </>
      )}
      <p className="explain-small">
        Radial heights are not sightline geometry. No new ray or clearance is calculated from this
        section. Onset witnesses lie on their own bracketing rays, which differ from this section’s
        azimuth. Dense bilinear samples do not add terrain knowledge.
      </p>
    </details>
  );
}
