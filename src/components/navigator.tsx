'use client';
import { SiteHeader, SiteFooter } from '@/components/site-header';
import { useEffect, useRef, useState } from 'react';
import type {
  BodyPosition,
  Metric,
  NavigatorManifest,
  NavigatorRecord,
  NavigatorSnapshot,
  SiteMeta,
} from '@/lib/navigator-contract';
import { snapshotIndex, snapshotUTC } from '@/lib/navigator-contract';
import { fixed, linePath, signed, utc } from '@/lib/format';

const metrics: { id: Metric; label: string }[] = [
  { id: 'sun', label: 'Sun' },
  { id: 'earth', label: 'Earth' },
  { id: 'simultaneous', label: 'Together' },
];
const requests = new Map<string, Promise<NavigatorRecord>>();
function loadSite(site: SiteMeta, count: number) {
  const key = `${site.id}:${site.sha256}`;
  let request = requests.get(key);
  if (!request) {
    request = fetch(site.href)
      .then(async (response) => {
        if (!response.ok) throw new Error('Site record unavailable');
        const bytes = await response.arrayBuffer();
        const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
          .map((byte) => byte.toString(16).padStart(2, '0'))
          .join('');
        if (hash !== site.sha256) throw new Error('Site record integrity mismatch');
        const record = JSON.parse(new TextDecoder().decode(bytes)) as NavigatorRecord;
        if (
          record.schema !== 'resolve.navigator.site.v1' ||
          record.site.id !== site.id ||
          record.samples.length !== count
        )
          throw new Error('Site record identity mismatch');
        return record;
      })
      .catch((error) => {
        requests.delete(key);
        throw error;
      });
    requests.set(key, request);
  }
  return request;
}

function BodyCard({ name, body }: { name: string; body: BodyPosition }) {
  return (
    <div className="navigator-body-card">
      <h3>{name}</h3>
      <p className={`body-state ${body.visible ? 'is-visible' : ''}`}>
        {body.visible ? 'Above modeled horizon' : 'Not above modeled horizon'}
      </p>
      <dl>
        <div>
          <dt>Azimuth</dt>
          <dd>{fixed(body.azimuth_deg, 3)}°</dd>
        </div>
        <div>
          <dt>Elevation</dt>
          <dd>{signed(body.elevation_deg, 3)}°</dd>
        </div>
        <div>
          <dt>Terrain horizon here</dt>
          <dd>{signed(body.horizon_deg, 3)}°</dd>
        </div>
        <div>
          <dt>Clearance</dt>
          <dd>{signed(body.clearance_deg, 3)}°</dd>
        </div>
      </dl>
    </div>
  );
}

function SkyView({ record, snapshot }: { record: NavigatorRecord; snapshot: NavigatorSnapshot }) {
  const [lo, hi] = [
    Math.floor(
      Math.min(
        -4,
        snapshot.sun.elevation_deg,
        snapshot.earth.elevation_deg,
        ...record.skyline.map((p) => p[1]),
      ),
    ) - 1,
    Math.ceil(
      Math.max(
        4,
        snapshot.sun.elevation_deg,
        snapshot.earth.elevation_deg,
        ...record.skyline.map((p) => p[1]),
      ),
    ) + 1,
  ];
  const x = (az: number) => 60 + (az / 360) * 800;
  const y = (el: number) => 280 - ((el - lo) / (hi - lo)) * 220;
  const ticks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4);
  return (
    <figure className="navigator-sky">
      <div className="panel-heading">
        <h2>Sun & Earth against the terrain horizon</h2>
      </div>
      <p className="navigator-chart-note">
        {record.site.id} · {utc(snapshot.utc, true)} UTC. Circle = Sun center; diamond = Earth
        center. Dashed line = local horizontal, 0°.
      </p>
      <div
        className="navigator-plot-scroll"
        tabIndex={0}
        role="region"
        aria-label="Sun and Earth horizon chart; scroll horizontally on small screens"
      >
        <svg
          viewBox="0 0 920 340"
          role="img"
          aria-label={`${record.site.id} Sun and Earth positions above the frozen 360-degree terrain skyline at ${snapshot.utc}`}
          data-testid="navigator-sky"
        >
          <text x="60" y="22" className="plot-label">
            Elevation (°)
          </text>
          {ticks.map((value) => (
            <g key={value}>
              <line x1="60" x2="860" y1={y(value)} y2={y(value)} className="plot-grid" />
              <text x="48" y={y(value) + 4} textAnchor="end" className="plot-label">
                {fixed(value, 1)}°
              </text>
            </g>
          ))}
          {[0, 90, 180, 270, 360].map((az, i) => (
            <g key={az}>
              <line x1={x(az)} x2={x(az)} y1="55" y2="280" className="plot-grid vertical" />
              <text x={x(az)} y="305" textAnchor="middle" className="plot-label">
                {['N 0°', 'E 90°', 'S 180°', 'W 270°', 'N 360°'][i]}
              </text>
            </g>
          ))}
          <line x1="60" x2="860" y1={y(0)} y2={y(0)} className="navigator-zero" />
          <path d={linePath(record.skyline, x, y)} className="reference-skyline" />
          <circle
            cx={x(snapshot.sun.azimuth_deg)}
            cy={y(snapshot.sun.elevation_deg)}
            r="7"
            className="sun-marker"
            data-testid="navigator-sun-marker"
          />
          <path
            d={`M${x(snapshot.earth.azimuth_deg)},${y(snapshot.earth.elevation_deg) - 7}l7 7-7 7-7-7z`}
            className="navigator-earth"
            data-testid="navigator-earth-marker"
          />
          <text
            x={x(snapshot.sun.azimuth_deg)}
            y={y(snapshot.sun.elevation_deg) - 14}
            textAnchor="middle"
            className="sun-text"
          >
            Sun
          </text>
          <text
            x={x(snapshot.earth.azimuth_deg)}
            y={y(snapshot.earth.elevation_deg) + 26}
            textAnchor="middle"
            className="plot-label"
          >
            Earth
          </text>
          <text x="460" y="334" textAnchor="middle" className="plot-label">
            Azimuth clockwise from geographic north
          </text>
        </svg>
      </div>
      <figcaption>
        The skyline is terrain elevation as an angle seen by the observer, not a surface
        cross-section. This view shows geometric centers, not body sizes. Numerical values and
        visibility states are listed above.
      </figcaption>
    </figure>
  );
}

function WindowTimeline({
  record,
  manifest,
  at,
}: {
  record: NavigatorRecord;
  manifest: NavigatorManifest;
  at: string;
}) {
  const start = Date.parse(manifest.domain.start_utc),
    end = Date.parse(manifest.domain.end_utc);
  const x = (value: string) => 92 + ((Date.parse(value) - start) / (end - start)) * 746;
  return (
    <figure className="navigator-timeline">
      <div
        className="navigator-plot-scroll"
        tabIndex={0}
        role="region"
        aria-label={`${record.site.id} visibility timeline; scroll horizontally on small screens`}
      >
        <svg
          viewBox="0 0 900 185"
          role="img"
          aria-label={`${record.site.id} Sun, Earth and simultaneous visibility, Nov 6 to Nov 28, 2026 UTC. Vertical cursor at ${at}.`}
        >
          {[6, 10, 14, 18, 22, 26, 28].map((day) => (
            <g key={day}>
              <line
                x1={x(`2026-11-${String(day).padStart(2, '0')}T00:00:00Z`)}
                x2={x(`2026-11-${String(day).padStart(2, '0')}T00:00:00Z`)}
                y1="12"
                y2="140"
                className="plot-grid"
              />
              <text
                x={x(`2026-11-${String(day).padStart(2, '0')}T00:00:00Z`)}
                y="163"
                textAnchor="middle"
                className="plot-label"
              >
                {day} Nov
              </text>
            </g>
          ))}
          {metrics.map(({ id, label }, row) => (
            <g key={id}>
              <text x="10" y={34 + row * 42} className="plot-label">
                {label}
              </text>
              {record.intervals[id].map((w, i) => (
                <g key={i}>
                  <rect
                    x={x(w.start_utc)}
                    y={20 + row * 42}
                    width={Math.max(0, x(w.end_utc) - x(w.start_utc))}
                    height="20"
                    className={`navigator-window window-${id}`}
                  />
                  {w.left_censored && (
                    <path
                      d={`M${x(w.start_utc) + 5},${23 + row * 42}l-4 7 4 7`}
                      className="navigator-censor"
                    />
                  )}
                  {w.right_censored && (
                    <path
                      d={`M${x(w.end_utc) - 5},${23 + row * 42}l4 7-4 7`}
                      className="navigator-censor"
                    />
                  )}
                </g>
              ))}
            </g>
          ))}
          <line x1={x(at)} x2={x(at)} y1="10" y2="141" className="navigator-cursor" />
        </svg>
      </div>
      <figcaption>
        Frozen event-refined intervals on a common UTC axis. End chevrons indicate clipping at the
        study boundary. The vertical cursor is the selected snapshot.
      </figcaption>
    </figure>
  );
}

function LongestWindows({ record }: { record: NavigatorRecord }) {
  return (
    <dl className="navigator-longest">
      {metrics.map(({ id, label }) => {
        const w = record.longest[id];
        return (
          <div key={id}>
            <dt>{label} · longest within study interval</dt>
            <dd>
              {w ? `${fixed(w.duration_s / 86400)} days` : 'No interval'}
              {w && (
                <span>
                  {w.left_censored || w.right_censored
                    ? 'Clipped · episode continues beyond a study boundary'
                    : 'Complete within study interval'}
                </span>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

interface SavedScenario {
  site: string;
  index: number;
}
function SnapshotOpportunity({
  record,
  snapshot,
}: {
  record: NavigatorRecord;
  snapshot: NavigatorSnapshot;
}) {
  const overlap = snapshot.overlap;
  const interval =
    overlap.interval_index === null ? null : record.intervals.simultaneous[overlap.interval_index];
  return (
    <div className="snapshot-opportunity" data-testid="snapshot-opportunity">
      <p className="eyebrow">Simultaneous opportunity from this snapshot</p>
      {overlap.kind === 'current' && interval ? (
        <>
          <p>
            <strong>{fixed(overlap.remaining_s! / 86400)} days remaining</strong>
            {interval.right_censored ? ' · clipped at the study boundary' : ''}
          </p>
          <p>
            Stored overlap ends {utc(interval.end_utc, true)} UTC.
            {interval.right_censored
              ? ' The physical episode continues beyond the displayed interval.'
              : ''}
          </p>
        </>
      ) : overlap.kind === 'next' && interval ? (
        <>
          <p>
            <strong>Next overlap begins {utc(interval.start_utc, true)} UTC</strong>
          </p>
          <p>
            No simultaneous visibility at this snapshot. The next interval is within the displayed
            study period.
          </p>
        </>
      ) : (
        <p>No later simultaneous overlap is stored within this study interval.</p>
      )}
    </div>
  );
}
export function Navigator({ manifest }: { manifest: NavigatorManifest }) {
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const [siteId, setSiteId] = useState(manifest.domain.default_site);
  const [index, setIndex] = useState(snapshotIndex(manifest, manifest.domain.default_utc));
  const [loaded, setLoaded] = useState<Record<string, NavigatorRecord>>({});
  const [failed, setFailed] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [saved, setSaved] = useState<SavedScenario[]>([]);
  const site = manifest.sites.find((s) => s.id === siteId)!;
  const record = loaded[siteId];
  const snapshot = record?.samples[index];
  const selectedUTC = snapshotUTC(manifest, index);
  const date = selectedUTC.slice(0, 10),
    time = selectedUTC.slice(11, 16);
  const dates = Array.from({ length: Math.ceil(manifest.domain.sample_count / 48) }, (_, i) =>
    snapshotUTC(manifest, i * 48).slice(0, 10),
  );
  const times = Array.from(
    { length: 48 },
    (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`,
  );
  const isSaved = saved.some((s) => s.site === siteId && s.index === index);
  useEffect(() => {
    if (loaded[site.id]) return;
    let current = true;
    setFailed(null);
    loadSite(site, manifest.domain.sample_count)
      .then((data) => {
        if (current) setLoaded((previous) => ({ ...previous, [site.id]: data }));
      })
      .catch(() => {
        if (current) setFailed(site.id);
      });
    return () => {
      current = false;
    };
  }, [site, loaded, retry, manifest.domain.sample_count]);
  function restore(scenario: SavedScenario) {
    setSiteId(scenario.site);
    setIndex(scenario.index);
    requestAnimationFrame(() => {
      resultHeading.current?.focus({ preventScroll: true });
      resultHeading.current?.closest('section')?.scrollIntoView({
        block: 'start',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
      });
    });
  }
  return (
    <>
      <a href="#navigator-main" className="skip-link">
        Skip to navigator
      </a>
      <SiteHeader active="navigator" context="Site & date navigator" />
      <main id="navigator-main" className="navigator-main">
        <div className="navigator-intro">
          <p className="eyebrow">Site & date navigator</p>
          <h1>Compare the opportunity. Then audit the answer.</h1>
          <p>
            Explore three supported de Gerlache candidate sites. See when the Sun and Earth are
            above the modeled horizon, then compare sites or dates.
          </p>
          <p className="navigator-scope">
            Study interval: 6–28 November 2026 UTC · snapshots every 30 minutes · observer 2 m above
            each site’s nominal Product 78 surface.
          </p>
        </div>
        <section className="navigator-controls" aria-label="Choose site and UTC snapshot">
          <label>
            Candidate site
            <select
              data-testid="navigator-site"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
            >
              {manifest.sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id}
                </option>
              ))}
            </select>
          </label>
          <label>
            UTC date
            <select
              data-testid="navigator-date"
              value={date}
              onChange={(e) =>
                setIndex(snapshotIndex(manifest, `${e.target.value}T${time}:00.000Z`))
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
              data-testid="navigator-time"
              value={time}
              onChange={(e) =>
                setIndex(snapshotIndex(manifest, `${date}T${e.target.value}:00.000Z`))
              }
            >
              {times.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <button
            className="primary-button navigator-save"
            data-testid="navigator-save"
            disabled={!snapshot || isSaved || saved.length >= 3}
            onClick={() => setSaved((previous) => [...previous, { site: siteId, index }])}
          >
            {isSaved ? 'COMPARISON SAVED' : 'SAVE FOR COMPARISON'}
          </button>
          <label className="navigator-slider">
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
          <div className="navigator-step">
            <button
              className="text-button"
              disabled={index === 0}
              onClick={() => setIndex((i) => i - 1)}
            >
              ← Previous 30 min
            </button>
            <output aria-live="polite" data-testid="navigator-utc">
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
          {saved.length >= 3 && (
            <p className="navigator-chart-note">
              Three scenarios saved. Remove one to add another.
            </p>
          )}
        </section>
        <section
          className="navigator-result"
          aria-label="Selected site result"
          aria-busy={!record && failed !== siteId}
        >
          <div className="navigator-site-heading">
            <h2 ref={resultHeading} tabIndex={-1}>
              {siteId}
            </h2>
            <p>
              {fixed(Math.abs(site.latitude_deg), 4)}° {site.latitude_deg < 0 ? 'S' : 'N'} ·{' '}
              {fixed(Math.abs(site.longitude_east_deg), 4)}°{' '}
              {site.longitude_east_deg < 0 ? 'W' : 'E'}
            </p>
          </div>
          {!record &&
            (failed === siteId ? (
              <div role="alert" className="navigator-error">
                <p>The selected site’s verified record could not be loaded. No result is shown.</p>
                <button className="secondary-button" onClick={() => setRetry((n) => n + 1)}>
                  Retry selected site
                </button>
              </div>
            ) : (
              <p role="status">Loading the selected site’s stored results…</p>
            ))}
          {record && snapshot && (
            <>
              <div className="navigator-current-state">
                <span className="eyebrow">At the selected UTC snapshot</span>
                <output data-testid="navigator-together">
                  {snapshot.simultaneous_visible
                    ? 'Sun and Earth centers are both above the modeled horizon.'
                    : 'Sun and Earth centers are not both above the modeled horizon.'}
                </output>
              </div>
              <SnapshotOpportunity record={record} snapshot={snapshot} />
              <div className="navigator-bodies">
                <BodyCard name="Sun" body={snapshot.sun} />
                <BodyCard name="Earth" body={snapshot.earth} />
              </div>
              <p className="navigator-chart-note">
                Geometric illumination and direct-to-Earth visibility opportunities. Power output
                and successful communication require additional operational analysis.
              </p>
              <SkyView record={record} snapshot={snapshot} />
              <h2 className="navigator-window-heading">Visibility across the study interval</h2>
              <WindowTimeline record={record} manifest={manifest} at={snapshot.utc} />
              <LongestWindows record={record} />
              <p className="navigator-domain-note">
                These durations stop at the study boundary when clipped. They are not complete
                episode lengths. For dGR101, the clipped simultaneous interval is 5.38 days; its
                complete episode is 7.40 days in the flagship audit.
              </p>
              <div className="navigator-audit-link">
                {siteId === 'dGR101' ? (
                  <>
                    <a className="secondary-button" href="/">
                      OPEN dGR101’S CASE STUDY AUDIT →
                    </a>
                    <p>
                      <a href="/factors/?site=dGR101&factor=domain&metric=simultaneous&representation=P78_5m&observer=fixed_absolute&domain=registered_domain">
                        Inspect dGR101’s study-period modeling factors →
                      </a>
                    </p>
                    <p>
                      The audit evaluates the frozen 22–30 November complete episode. It does not
                      audit whichever snapshot is selected here.
                    </p>
                  </>
                ) : (
                  <p>
                    The full terrain-representation audit is available for dGR101. This site is a
                    nominal screening result.
                  </p>
                )}
              </div>
              <details className="navigator-evidence">
                <summary>Sources, exact intervals & model definitions for {siteId}</summary>
                <p>{site.validation}</p>
                <p>
                  {site.local_product}; {site.exterior_products}. Horizon rays every{' '}
                  {site.azimuth_step_deg}°, radial refinement factor {site.radial_factor}, extent{' '}
                  {site.max_distance_m / 1000} km.
                </p>
                <p>
                  {manifest.geometry.frame} · {manifest.geometry.ephemeris} · geometric centers
                  (aberration NONE). Clearance must be strictly greater than zero. Absolute observer
                  elevation: {site.absolute_observer_height_m} m above the reference sphere.
                </p>
                <p>
                  Timelines copy the frozen event solution at {record.event_sampling_step_s}-second
                  event-search cadence. Root-refined event timestamps are retained separately from
                  the 30-minute display snapshots.
                </p>
                <table>
                  <caption>Exact frozen intervals · UTC</caption>
                  <thead>
                    <tr>
                      <th>Observable</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Duration (s)</th>
                      <th>Clipping</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.flatMap(({ id, label }) =>
                      record.intervals[id].map((w, i) => (
                        <tr key={`${id}-${i}`}>
                          <th>{label}</th>
                          <td>{w.start_utc}</td>
                          <td>{w.end_utc}</td>
                          <td>{w.duration_s}</td>
                          <td>
                            {w.left_censored ? 'Left ' : ''}
                            {w.right_censored ? 'Right' : ''}
                            {!w.left_censored && !w.right_censored ? 'None' : ''}
                          </td>
                        </tr>
                      )),
                    )}
                  </tbody>
                </table>
                <p>
                  Frozen horizon: {manifest.sources[site.horizon_source].path}
                  <br />
                  Frozen intervals: {manifest.sources[site.visibility_source].path}
                  {site.visibility_pointer}
                </p>
                <p>
                  <a href={site.href} download>
                    Download selected numerical record
                  </a>{' '}
                  ·{' '}
                  <a href="/evidence/navigator/manifest.v1.json" download>
                    Download provenance manifest
                  </a>
                </p>
                <p className="navigator-record-hash">
                  Selected product record SHA-256: {site.sha256}
                </p>
              </details>
            </>
          )}
        </section>
        <section className="navigator-comparisons" aria-labelledby="comparison-heading">
          <h2 id="comparison-heading">Compare saved scenarios ({saved.length}/3)</h2>
          <p>
            Save a site and UTC snapshot, change the site or date, then save another. All timelines
            use the same study interval. Different validation depth and terrain sampling remain
            visible. Saved comparisons last while this page stays open.
          </p>
          <p className="sr-only" role="status">
            {saved.length} comparison scenarios saved.
          </p>
          {!saved.length && <p className="navigator-empty">No scenarios saved yet.</p>}
          {saved.map((scenario, i) => {
            const data = loaded[scenario.site],
              sample = data.samples[scenario.index];
            return (
              <article className="navigator-saved" key={`${scenario.site}-${scenario.index}`}>
                <div className="navigator-saved-heading">
                  <div>
                    <p className="eyebrow">Scenario {i + 1}</p>
                    <h3>
                      {scenario.site} · {utc(sample.utc, true)} UTC
                    </h3>
                  </div>
                  <div>
                    <button
                      className="text-button"
                      onClick={() => restore(scenario)}
                      aria-label={`Inspect scenario ${i + 1}`}
                    >
                      Inspect ↗
                    </button>
                    <button
                      className="text-button"
                      onClick={() => setSaved((previous) => previous.filter((_, j) => j !== i))}
                      aria-label={`Remove scenario ${i + 1}`}
                    >
                      Remove ×
                    </button>
                  </div>
                </div>
                <p>
                  Sun: {sample.sun.visible ? 'above horizon' : 'not above horizon'} · Earth:{' '}
                  {sample.earth.visible ? 'above horizon' : 'not above horizon'} · Together:{' '}
                  {sample.simultaneous_visible ? 'visible' : 'not visible'}
                </p>
                <SnapshotOpportunity record={data} snapshot={sample} />
                <WindowTimeline record={data} manifest={manifest} at={sample.utc} />
                <LongestWindows record={data} />
                <p className="navigator-chart-note">
                  {manifest.sites.find((s) => s.id === scenario.site)!.validation}
                </p>
              </article>
            );
          })}
        </section>
        <section className="navigator-limitations">
          <h2>Scope & scientific limits</h2>
          <ul>
            {manifest.limitations.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
          <p>
            NASA data: <a href="https://pgda.gsfc.nasa.gov/products/78">Product 78</a> ·{' '}
            <a href="https://pgda.gsfc.nasa.gov/products/90">Product 90</a> ·{' '}
            <a href="https://ssd.jpl.nasa.gov/planets/eph_export.html">JPL ephemerides</a>
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
