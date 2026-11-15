'use client';
import { SiteHeader, SiteFooter } from '@/components/site-header';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type {
  AuditMetric,
  Comparison,
  Evidence,
  FactorId,
  FactorManifest,
  FactorRecord,
  FactorSelection,
  Measurement,
} from '@/lib/factor-contract';
import { applicableControls, formatEffect, matchingComparisons } from '@/lib/factor-contract';
import { fixed, utc } from '@/lib/format';

const cache = new Map<string, Promise<FactorRecord>>();
function loadRecord(site: FactorManifest['sites'][number]) {
  const key = `${site.id}:${site.sha256}`;
  let request = cache.get(key);
  if (!request) {
    request = fetch(site.href)
      .then(async (response) => {
        if (!response.ok) throw new Error('Factor record unavailable');
        const bytes = await response.arrayBuffer();
        const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
          .map((v) => v.toString(16).padStart(2, '0'))
          .join('');
        if (hash !== site.sha256) throw new Error('Factor record integrity mismatch');
        const result = JSON.parse(new TextDecoder().decode(bytes)) as FactorRecord;
        if (
          result.schema !== 'resolve.factors.site.v1' ||
          result.site !== site.id ||
          result.comparisons.length !== site.comparisons
        )
          throw new Error('Factor record identity mismatch');
        return result;
      })
      .catch((error) => {
        cache.delete(key);
        throw error;
      });
    cache.set(key, request);
  }
  return request;
}
function Location({ value, manifest }: { value: Evidence<unknown>; manifest: FactorManifest }) {
  const source = manifest.sources[value.source.sourceId];
  return (
    <span className="factor-source-location">
      {source.path} ·{' '}
      {value.source.row
        ? `CSV row ${value.source.row}, ${value.source.field}`
        : value.source.pointer}
    </span>
  );
}
function PairChart({
  before,
  after,
  comparison,
}: {
  before: Measurement;
  after: Measurement;
  comparison: Comparison;
}) {
  const maximum = Math.max(1, Math.ceil(Math.max(before.days, after.days)));
  return (
    <figure
      className="factor-pair-chart"
      aria-label="Paired durations on the same zero-based scale"
    >
      <figcaption>
        Longest interval under each stated definition · shared 0–{maximum}-day scale
      </figcaption>
      {[
        { label: comparison.beforeLabel, point: before },
        { label: comparison.afterLabel, point: after },
      ].map(({ label, point }, i) => (
        <div className={`factor-duration-row ${i ? 'after' : ''}`} key={i}>
          <span>{label}</span>
          <div className="factor-duration-track" aria-hidden="true">
            <div style={{ width: `${(point.days / maximum) * 100}%` }} />
          </div>
          <strong>{fixed(point.days)} d</strong>
        </div>
      ))}
    </figure>
  );
}
function EndpointCard({ label, value }: { label: string; value: Measurement }) {
  return (
    <div className="factor-endpoint">
      <h3>{label}</h3>
      <p>
        {utc(value.start.value, true)} → {utc(value.end.value, true)} UTC
      </p>
      <p>
        {value.leftCensored.value || value.rightCensored.value
          ? `Clipped at ${value.leftCensored.value ? 'start' : ''}${value.leftCensored.value && value.rightCensored.value ? ' and ' : ''}${value.rightCensored.value ? 'end' : ''}; this boundary does not establish a physical transition.`
          : 'No endpoint censoring in this selected interval.'}
      </p>
    </div>
  );
}
function ExactEvidence({
  before,
  after,
  comparison,
  manifest,
}: {
  before: Measurement;
  after: Measurement;
  comparison: Comparison;
  manifest: FactorManifest;
}) {
  const fields = [
    ['Stored duration', 'duration'],
    ['Start UTC', 'start'],
    ['End UTC', 'end'],
    ['Left censored', 'leftCensored'],
    ['Right censored', 'rightCensored'],
  ] as const;
  const ids = new Set([before.duration.source.sourceId, after.duration.source.sourceId]);
  return (
    <details className="factor-evidence">
      <summary>Inspect exact values, definitions & sources</summary>
      <table>
        <caption>Unrounded scientific fields and their source locations</caption>
        <thead>
          <tr>
            <th>Field</th>
            <th>Before</th>
            <th>After</th>
          </tr>
        </thead>
        <tbody>
          {fields.map(([label, key]) => (
            <tr key={key}>
              <th>{label}</th>
              {[before, after].map((point, i) => (
                <td key={i}>
                  <code>{point[key].original}</code> {point[key].unit}
                  <Location value={point[key]} manifest={manifest} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Display duration in days: {before.days} → {after.days}. Stored seconds, where used, are
        divided by 86,400 for display.
      </p>
      <p>
        Derived difference: {after.days - before.days} days. {comparison.deltaDefinition}
      </p>
      {[...ids].map((id) => (
        <p key={id}>
          {manifest.sources[id].href && (
            <a href={manifest.sources[id].href} download>
              Download exact source file
            </a>
          )}
          <span className="factor-record-hash">
            {manifest.sources[id].path}
            <br />
            SHA-256 {manifest.sources[id].sha256}
          </span>
        </p>
      ))}
      <p>
        <a href="/evidence/factors/manifest.v1.json" download>
          Download source manifest
        </a>
      </p>
    </details>
  );
}

export function FactorAudit({ manifest }: { manifest: FactorManifest }) {
  const params = useSearchParams(),
    router = useRouter();
  const siteId = params.get('site') || 'dGR101';
  const factorParam = params.get('factor') || 'terrain',
    metricParam = params.get('metric') || 'simultaneous';
  const factor = manifest.factors.find((f) => f.id === factorParam)?.id;
  const metric = manifest.metrics.find((m) => m.id === metricParam)?.id;
  const observer = params.get('observer') || 'fixed_absolute',
    domain = params.get('domain') || 'uncensored_intersecting_registered';
  const variant = params.get('representation') || params.get('variant') || 'P90_80m';
  const site = manifest.sites.find((s) => s.id === siteId);
  const valid =
    site &&
    factor &&
    metric &&
    ['fixed_absolute', 'each_surface_2m'].includes(observer) &&
    ['registered_domain', 'uncensored_intersecting_registered'].includes(domain);
  const [loaded, setLoaded] = useState<Record<string, FactorRecord>>({}),
    [failed, setFailed] = useState<string | null>(null),
    [retry, setRetry] = useState(0);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const record = valid ? loaded[site.id] : undefined;
  const selection: FactorSelection = {
    site: siteId,
    factor: factor || 'terrain',
    metric: metric || 'simultaneous',
    observer,
    domain,
    variant,
  };
  const rows = record ? matchingComparisons(record, selection) : [];
  const rowId = params.get('comparison');
  const missingPair = Boolean(rowId && record && rows.length && !rows.some((c) => c.id === rowId));
  const chosen = missingPair
    ? undefined
    : rows.find((c) => c.id === rowId) || rows.find((c) => c.variant === variant) || rows[0];
  const active = applicableControls(siteId, factor || 'terrain');
  useEffect(() => {
    if (!valid || loaded[site.id]) return;
    let current = true;
    setFailed(null);
    loadRecord(site)
      .then((result) => {
        if (current) setLoaded((old) => ({ ...old, [site.id]: result }));
      })
      .catch(() => {
        if (current) setFailed(site.id);
      });
    return () => {
      current = false;
    };
  }, [site, valid, loaded, retry]);
  function update(changes: Record<string, string>, focus = false) {
    const next = new URLSearchParams(window.location.search);
    next.delete('comparison');
    for (const [key, value] of Object.entries(changes)) next.set(key, value);
    window.history.replaceState(null, '', `/factors/?${next.toString()}`);
    if (focus)
      requestAnimationFrame(() => {
        detailHeading.current?.focus({ preventScroll: true });
        detailHeading.current?.scrollIntoView({
          block: 'start',
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'instant'
            : 'smooth',
        });
      });
  }
  const pair = chosen && metric ? chosen.values[metric] : undefined;
  const before = record && pair ? record.measurements[pair.before] : undefined,
    after = record && pair ? record.measurements[pair.after] : undefined;
  const scope = record && chosen ? record.scopes[chosen.scope] : undefined;
  return (
    <>
      <a href="#factor-main" className="skip-link">
        Skip to modeling-factor audit
      </a>
      <SiteHeader active="audit" context="Modeling choices" />
      <main className="factor-main" id="factor-main">
        <div className="factor-intro">
          <a className="workspace-back" href="/">
            ← Open flagship case
          </a>
          <p className="eyebrow">Compare modeling choices</p>
          <h1>Which assumptions change the result?</h1>
          <p>
            Inspect paired scientific results. Each comparison states what changed, what stayed
            fixed, and which evidence supports it.
          </p>
          <p className="factor-core-limit">
            These effects have different scopes. They do not add up to an uncertainty budget or a
            confidence score.
          </p>
        </div>
        <section className="factor-controls" aria-label="Choose audit context">
          <label>
            Audited site
            <select
              data-testid="factor-site"
              value={site?.id || ''}
              onChange={(e) =>
                update({ site: e.target.value, variant: 'P90_80m', representation: 'P90_80m' })
              }
            >
              {!site && <option value="">Choose an audited site</option>}
              {manifest.sites.map((s) => (
                <option key={s.id}>{s.id}</option>
              ))}
            </select>
          </label>
          <label>
            Observable
            <select
              data-testid="factor-metric"
              value={metric || ''}
              onChange={(e) => update({ metric: e.target.value })}
            >
              {!metric && <option value="">Choose observable</option>}
              {manifest.metrics.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Observer convention
            <select
              data-testid="factor-observer"
              disabled={!active.observer}
              value={active.observer ? observer : 'as_recorded'}
              onChange={(e) => update({ observer: e.target.value })}
            >
              {!active.observer && (
                <option value="as_recorded">As stated in paired evidence</option>
              )}
              <option value="fixed_absolute">Fixed absolute elevation</option>
              <option value="each_surface_2m">2 m above each represented surface</option>
            </select>
          </label>
          <label>
            Reporting domain
            <select
              data-testid="factor-domain"
              disabled={!active.domain}
              value={active.domain ? domain : 'as_recorded'}
              onChange={(e) => update({ domain: e.target.value })}
            >
              {!active.domain && <option value="as_recorded">As stated in paired evidence</option>}
              <option value="uncensored_intersecting_registered">Complete relevant episodes</option>
              <option value="registered_domain">Nov 6–28 clipped</option>
            </select>
          </label>
        </section>
        {!valid && (
          <div role="alert" className="factor-error">
            The requested audit context is unavailable. Choose dGR101 or dGR203 and supported
            definitions. No result is inferred for an unsupported site or setting.
            <button
              className="secondary-button"
              onClick={() => router.replace('/factors/', { scroll: false })}
            >
              Reset to supported audit
            </button>
          </div>
        )}
        <section className="factor-family-section" aria-label="Modeling factor families">
          <div className="factor-family-grid">
            {manifest.factors.map((f) => (
              <button
                key={f.id}
                data-testid={`factor-family-${f.id}`}
                aria-pressed={factor === f.id}
                onClick={() => update({ factor: f.id })}
              >
                <strong>{f.label}</strong>
                <span>
                  {site && site.coverage[f.id] > 0
                    ? 'Comparisons available'
                    : 'Not assessed at this site'}
                </span>
              </button>
            ))}
          </div>
        </section>
        {valid &&
          !record &&
          (failed === site.id ? (
            <div role="alert" className="factor-error">
              <p>
                The selected audit’s verified evidence could not be loaded. No previous site’s
                result is shown.
              </p>
              <button className="secondary-button" onClick={() => setRetry((n) => n + 1)}>
                Retry audit evidence
              </button>
            </div>
          ) : (
            <p role="status">Loading the selected audit’s source-backed comparisons…</p>
          ))}
        {valid && record && (
          <section className="factor-results" aria-label="Factor comparison results">
            <div className="factor-section-heading">
              <h2>
                {site.id} · {manifest.factors.find((f) => f.id === factor)!.label}
              </h2>
              <p>{manifest.factors.find((f) => f.id === factor)!.description}</p>
            </div>
            {!rows.length ? (
              <div className="factor-unassessed" data-testid="factor-unassessed">
                <h3>NOT ASSESSED</h3>
                <p>
                  {manifest.unassessed[site.id]?.[factor] ||
                    'No matched comparison is available in the frozen evidence for this site and factor.'}
                </p>
                <p>Absence of a test is not evidence of stability or zero sensitivity.</p>
                {site.id === 'dGR101' && factor === 'stochastic' && (
                  <button
                    className="secondary-button"
                    onClick={() => update({ site: 'dGR203', factor: 'stochastic' })}
                  >
                    Inspect the separate dGR203 five-clone pilot →
                  </button>
                )}
              </div>
            ) : (
              <>
                {missingPair && (
                  <p role="status" className="factor-error">
                    The requested pair is unavailable in this context. Choose one of the supported
                    comparisons below.
                  </p>
                )}
                <label className="factor-mobile-chooser">
                  Choose a paired comparison
                  <select
                    data-testid="factor-comparison-select"
                    value={chosen?.id || ''}
                    onChange={(e) => {
                      const row = rows.find((r) => r.id === e.target.value)!;
                      update({ comparison: row.id, representation: row.variant }, true);
                    }}
                  >
                    {!chosen && (
                      <option value="" disabled>
                        Choose a supported comparison
                      </option>
                    )}
                    {rows.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="factor-content-grid">
                  <div
                    className="factor-comparison-list"
                    role="group"
                    aria-label="Choose a scoped comparison"
                  >
                    {rows.map((row) => {
                      const value = row.values[metric || 'simultaneous'],
                        a = record.measurements[value.before],
                        b = record.measurements[value.after];
                      return (
                        <button
                          key={row.id}
                          data-testid={`comparison-${row.variant}`}
                          aria-pressed={chosen?.id === row.id}
                          onClick={() =>
                            update({ comparison: row.id, representation: row.variant }, true)
                          }
                        >
                          <span>
                            <strong>{row.label}</strong>
                            <small>{row.badge}</small>
                          </span>
                          <span>
                            {fixed(a.days)} → {fixed(b.days)} d
                          </span>
                          <strong>{formatEffect(value.deltaDays)}</strong>
                        </button>
                      );
                    })}
                  </div>
                  {chosen && pair && before && after && scope && (
                    <article className="factor-detail" data-testid="factor-detail">
                      <p className="eyebrow">
                        {chosen.badge === 'Reference only' ? 'Reference only' : chosen.kind}
                      </p>
                      <h2 ref={detailHeading} tabIndex={-1}>
                        {chosen.label}
                      </h2>
                      <p className="factor-study-label">
                        {scope.site} · {scope.experiment}
                      </p>
                      <output
                        className="factor-change"
                        data-testid="factor-delta"
                        aria-label={`${pair.deltaDays} days, after minus before`}
                      >
                        {formatEffect(pair.deltaDays)}
                        <span>
                          change in{' '}
                          {manifest.metrics.find((m) => m.id === metric)!.label.toLowerCase()}{' '}
                          duration
                        </span>
                      </output>
                      <p className="factor-qualification">
                        {chosen.badge === 'Reference only'
                          ? 'The same representation is repeated on both sides. This is the reference row, not a test of an alternative model. '
                          : ''}
                        {scope.qualification}
                      </p>
                      <a
                        className="secondary-button factor-explain-link"
                        href={`/explain/?${new URLSearchParams({ site: siteId, comparison: chosen.id, metric: metric || 'simultaneous' }).toString()}`}
                      >
                        Explain this comparison →
                      </a>
                      <PairChart before={before} after={after} comparison={chosen} />
                      <div className="factor-endpoints">
                        <EndpointCard label={chosen.beforeLabel} value={before} />
                        <EndpointCard label={chosen.afterLabel} value={after} />
                      </div>
                      <div className="factor-scope">
                        <h3>Scope of this comparison</h3>
                        <dl>
                          <div>
                            <dt>Site coordinates</dt>
                            <dd>{scope.coordinates}</dd>
                          </div>
                          <div>
                            <dt>Domain</dt>
                            <dd data-testid="factor-scope-domain">{scope.domain}</dd>
                          </div>
                          <div>
                            <dt>Observer</dt>
                            <dd>{scope.observer}</dd>
                          </div>
                          <div>
                            <dt>Visibility definition</dt>
                            <dd>{scope.semantics}</dd>
                          </div>
                          <div>
                            <dt>Changed</dt>
                            <dd>
                              {chosen.badge === 'Reference only'
                                ? 'No change: the same reference result is shown twice.'
                                : scope.changed}
                            </dd>
                          </div>
                          <div>
                            <dt>Held fixed</dt>
                            <dd>
                              <ul>
                                {scope.held.map((item) => (
                                  <li key={item}>{item}</li>
                                ))}
                              </ul>
                            </dd>
                          </div>
                        </dl>
                      </div>
                      <ExactEvidence
                        before={before}
                        after={after}
                        comparison={chosen}
                        manifest={manifest}
                      />
                      <p className="factor-record-download">
                        <a href={site.href} download>
                          Download this site’s numerical comparisons
                        </a>{' '}
                        ·{' '}
                        <a href={siteId === 'dGR101' ? '/' : '/factors/?site=dGR101'}>
                          {siteId === 'dGR101'
                            ? 'Return to the flagship mechanism'
                            : 'Open the separate dGR101 evidence'}
                        </a>
                      </p>
                    </article>
                  )}
                </div>
              </>
            )}
          </section>
        )}
        <section className="factor-limits">
          <h2>Interpretation limits</h2>
          <ul>
            {manifest.limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>
            A complete mission decision also needs a specified requirement and operational model.
            This workbench reports measured or definition-dependent changes; it does not issue
            mission certification.
          </p>
          <p>
            <a href={manifest.sources.taxonomy.href} download>
              Read the provisional research taxonomy
            </a>
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
