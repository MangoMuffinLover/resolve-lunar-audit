'use client';
import dynamic from 'next/dynamic';
import { useCallback, useRef, useState } from 'react';
import type { AuditData, Observer, Domain } from '@/lib/contract';
import { caseKey } from '@/lib/contract';
import { fixed, signed, utc } from '@/lib/format';
import { Timeline } from './timeline';
import { RepresentationLadder } from './representation-ladder';
import { EvidenceDrawer } from './evidence-drawer';
import { SiteHeader, SiteFooter } from './site-header';
import type { AuditPhysics } from './audit-mechanism';

const Mechanism = dynamic(() => import('./audit-mechanism'), {
  loading: () => (
    <p role="status" className="loading-profile">
      Opening the paired horizon evidence…
    </p>
  ),
});
const HorizonExperience = dynamic(() => import('./horizon-experience'), {
  loading: () => (
    <p role="status" className="loading-profile">
      Opening detailed terrain records…
    </p>
  ),
});
function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

export function DecisionAudit({ data, physics }: { data: AuditData; physics: AuditPhysics }) {
  const [audited, setAudited] = useState(false),
    [why, setWhy] = useState(false),
    [evidence, setEvidence] = useState(false),
    [detailed, setDetailed] = useState(false);
  const [selected, setSelected] = useState(data.defaults.comparison);
  const [observer, setObserver] = useState<Observer>(data.defaults.observer),
    [domain, setDomain] = useState<Domain>(data.defaults.domain);
  const auditHeading = useRef<HTMLHeadingElement>(null),
    whyHeading = useRef<HTMLHeadingElement>(null),
    whyPending = useRef(false);
  const initial =
    data.cases[caseKey(data.defaults.id, data.defaults.observer, data.defaults.domain)];
  const result = data.cases[caseKey(selected, observer, domain)],
    baseline = data.cases[caseKey('P78_5m', observer, domain)];
  const model = data.representations.find((m) => m.id === selected)!;
  const witness = data.witnesses.find(
    (w) => w.id === selected && w.observer === observer && w.diagnostic === 'own_late_solar_onset',
  )!;
  const fixedSdem =
      data.cases[caseKey('P104_5m', 'fixed_absolute', 'uncensored_intersecting_registered')],
    surfaceSdem =
      data.cases[caseKey('P104_5m', 'each_surface_2m', 'uncensored_intersecting_registered')];
  const clipped = data.cases[caseKey('P78_5m', 'fixed_absolute', 'registered_domain')];
  const factors = `/factors/?${new URLSearchParams({ site: 'dGR101', factor: 'terrain', metric: 'simultaneous', representation: selected, observer, domain })}`;
  const focusSoon = useCallback(
    (target: 'audit' | 'why') =>
      requestAnimationFrame(() => {
        const heading = (target === 'audit' ? auditHeading : whyHeading).current;
        heading?.focus({ preventScroll: true });
        heading?.closest('section')?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'instant'
            : 'smooth',
          block: 'start',
        });
      }),
    [],
  );
  const ready = useCallback(() => {
    if (whyPending.current) {
      whyPending.current = false;
      focusSoon('why');
    }
  }, [focusSoon]);
  function startAudit() {
    setAudited(true);
    focusSoon('audit');
  }
  function openWhy() {
    whyPending.current = !why;
    setWhy(true);
    focusSoon('why');
  }
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to decision audit
      </a>
      <SiteHeader active="audit" />
      <main id="main" className="audit-home">
        <section className="audit-hero" aria-labelledby="result-heading">
          <div className="audit-hero-copy">
            <p className="eyebrow">
              <span className="signal-dot" aria-hidden="true" /> Lunar visibility audit
            </p>
            <h1 id="result-heading">
              Before you trust the window,
              <br /> <em>audit the model.</em>
            </h1>
            <p className="audit-hero-intro">
              A precise number may still depend on the terrain representation. Find out what
              changes—and trace the reason.
            </p>
            <div className="audit-site">
              <span className="site-code">{data.site}</span>
              <span>
                {data.region}
                <small>
                  {fixed(data.geometry.latitude.value, 3)}° /{' '}
                  {fixed(data.geometry.longitude.value, 3)}° E · {data.year}
                </small>
              </span>
            </div>
          </div>
          <div className="reference-card">
            <div className="reference-card-top">
              <span className="eyebrow">The reference result</span>
              <span className="record-label">01</span>
            </div>
            <p className="reference-observable">Modeled Sun & Earth visibility at {data.site}</p>
            <output
              className="reference-number"
              data-testid="initial-duration"
              aria-label={`${initial.simultaneous.days.original} days`}
            >
              <span>{fixed(initial.simultaneous.days.value)}</span>
              <span>DAYS</span>
            </output>
            <div className="reference-scope">
              <span>NASA Product 78 · 5 m</span>
              <span>Fixed absolute observer</span>
              <span>Complete episode</span>
            </div>
            <button className="primary-button" onClick={startAudit}>
              {audited ? 'Return to the audit' : 'Audit this result'}
              <Arrow />
            </button>
            <p className="reference-qualifier">
              Geometric Sun/Earth centers. This result does not establish available power or a
              working communications link.
            </p>
            <button className="reference-evidence" onClick={() => setEvidence(true)}>
              Result evidence <Arrow />
            </button>
          </div>
        </section>
        <div className="audit-path" role="group" aria-label="The audit process">
          <span>
            <b>01</b> Start with a result
          </span>
          <span>
            <b>02</b> Test the representation
          </span>
          <span>
            <b>03</b> Trace the mechanism
          </span>
          <a href="/navigator/">
            Explore sites & dates <Arrow />
          </a>
        </div>
        {audited && (
          <section
            className="audit-section redesigned-audit"
            aria-labelledby="audit-heading"
            data-testid="audit-section"
          >
            <div className="section-kicker">
              <span className="eyebrow">02 / Audit the result</span>
              <button className="text-button" onClick={() => setEvidence(true)}>
                Result evidence <Arrow />
              </button>
            </div>
            <div className="audit-title-row">
              <h2 id="audit-heading" ref={auditHeading} tabIndex={-1}>
                {selected === 'P78_5m'
                  ? 'The reference is selected.'
                  : model.type === 'synthetic-control'
                    ? 'A synthetic control. A different modeled window.'
                    : 'Another NASA terrain representation. Another modeled window.'}
              </h2>
              <span className="status-label">
                {selected === 'P78_5m' ? 'REFERENCE SELECTED' : data.classification}
              </span>
            </div>
            <div className="audit-reveal" data-testid="audit-reveal">
              <div className="audit-result-pair">
                <div>
                  <span className="eyebrow">Reference / Product 78 · native 5 m</span>
                  <p>
                    {fixed(baseline.simultaneous.days.value)}
                    <small>days</small>
                  </p>
                </div>
                <span className="pair-arrow" aria-hidden="true">
                  →
                </span>
                <div>
                  <span className="eyebrow" data-testid="selected-label">
                    {model.label}
                  </span>
                  <output
                    data-testid="selected-duration"
                    aria-label={`${result.simultaneous.days.original} days`}
                  >
                    {fixed(result.simultaneous.days.value)}
                    <small>DAYS</small>
                  </output>
                </div>
              </div>
              <div className="audit-delta">
                <strong data-testid="selected-delta">{signed(result.delta.value)} d</strong>
                <span>
                  after minus reference
                  <br />
                  under the same definitions
                </span>
              </div>
              <p className="sr-only">
                {fixed(baseline.simultaneous.days.value)} → {fixed(result.simultaneous.days.value)}{' '}
                days.
              </p>
              <p className="reveal-context">
                {selected === 'P78_5m'
                  ? 'The reference representation is selected. Choose another product in the representation explorer.'
                  : observer === 'fixed_absolute'
                    ? `Same ${data.site} site, celestial geometry and absolute observer elevation. Different evaluated terrain representation.`
                    : `${data.site}: same ephemeris. Observer is 2 m above each represented surface; absolute elevation changes.`}
              </p>
              <p className="reveal-domain">
                {domain === 'registered_domain'
                  ? 'Clipped to Nov 6–28; these durations are right-censored.'
                  : 'Complete modeled episodes intersecting Nov 6–28; includes time beyond that screening interval.'}
              </p>
              <div className="audit-reveal-actions">
                <button className="primary-button reveal-why" onClick={openWhy}>
                  See why it changes <Arrow />
                </button>
                <a href={factors}>
                  Compare modeling choices <Arrow />
                </a>
              </div>
            </div>
            <p className="audit-meaning">
              {selected === 'P78_5m'
                ? 'This is the reference comparison. Both sides use the same representation; select another product to inspect its response.'
                : 'The modeled duration changes with the terrain representation. This does not establish which prediction is physically correct.'}
            </p>
            <details className="analysis-settings">
              <summary>
                <strong>Analysis definitions</strong>{' '}
                <span>
                  {observer === 'fixed_absolute'
                    ? 'Fixed absolute elevation'
                    : '2 m above each surface'}{' '}
                  · {data.domains[domain].label}
                </span>
              </summary>
              <div className="settings-grid">
                <label>
                  Observer definition
                  <select
                    value={observer}
                    onChange={(e) => setObserver(e.target.value as Observer)}
                    data-testid="observer-select"
                  >
                    <option value="fixed_absolute">Fixed absolute observer · default</option>
                    <option value="each_surface_2m">2 m above each represented ground</option>
                  </select>
                  <small>
                    {observer === 'fixed_absolute'
                      ? 'The celestial observer stays at one absolute elevation.'
                      : 'Celestial position follows each represented ground +2 m.'}
                  </small>
                </label>
                <label>
                  Reporting domain
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value as Domain)}
                    data-testid="domain-select"
                  >
                    <option value="uncensored_intersecting_registered">
                      Complete intervals · default
                    </option>
                    <option value="registered_domain">Registered domain · Nov 6–28</option>
                  </select>
                  <small>{data.domains[domain].description}</small>
                </label>
              </div>
              <p className="settings-note">
                These controls switch among frozen results. Neither observer convention is
                universally preferred.
              </p>
            </details>
            <details className="representation-explorer">
              <summary>
                <strong>Explore terrain representations</strong>{' '}
                <span>Native NASA grids, separate SDEM & synthetic control</span>
              </summary>
              <div className="panel-heading">
                <h3>Terrain representation response</h3>
                <span className="unit-label">SIMULTANEOUS / DAYS</span>
              </div>
              <RepresentationLadder
                data={data}
                observer={observer}
                domain={domain}
                selected={selected}
                onSelect={setSelected}
              />
            </details>
            {selected === 'P104_5m' && (
              <p className="sdem-note" data-testid="sdem-note">
                <strong>Observer definition matters here.</strong> SDEM represents ground
                approximately {data.reportedComparisons.sdemGroundOffset.original} m higher than
                nominal SL2. The common absolute observer is {fixed(fixedSdem.aboveGround.value, 6)}{' '}
                m above its represented ground; the alternative places it 2 m above that ground.
              </p>
            )}
            {result.simultaneous.rightCensored.value && (
              <p className="censor-note" data-testid="censor-note">
                Clipped at Nov 28. This duration is right-censored; the modeled episode continues.
              </p>
            )}
            <details className="selected-timeline">
              <summary>Inspect the selected Sun/Earth overlap</summary>
              <Timeline result={result} compact />
              <p className="selected-interval">
                {utc(result.simultaneous.start.value, true)} →{' '}
                {utc(result.simultaneous.end.value, true)} UTC · 2026
              </p>
              <button className="text-button" onClick={() => setEvidence(true)}>
                Exact record <Arrow />
              </button>
            </details>
          </section>
        )}
        {audited && why && (
          <section className="why-section redesigned-why" aria-labelledby="why-heading">
            <div className="section-kicker">
              <span className="eyebrow">03 / Trace the mechanism</span>
              <span className="record-label">Stored horizons & geometry</span>
            </div>
            <h2 id="why-heading" ref={whyHeading} tabIndex={-1}>
              {selected === 'P78_5m' ? (
                'The reference skyline is unchanged.'
              ) : (
                <>
                  {observer === 'fixed_absolute'
                    ? 'Same Sun and Earth.'
                    : 'Same ephemeris. Different observer.'}
                  <br />
                  Different modeled skyline.
                </>
              )}
            </h2>
            <Mechanism
              physics={physics}
              selected={selected}
              observer={observer}
              domain={domain}
              onReady={ready}
            />
            <details
              className="legacy-evidence"
              onToggle={(e) => setDetailed(e.currentTarget.open)}
            >
              <summary>Detailed horizon, terrain & support records</summary>
              {detailed && (
                <HorizonExperience
                  data={data}
                  result={result}
                  model={model}
                  observer={observer}
                  onReady={ready}
                />
              )}
            </details>
            <button className="text-button evidence-link" onClick={() => setEvidence(true)}>
              Trace this result to the source record <Arrow />
            </button>
          </section>
        )}
        {audited && why && (
          <section className="audit-assumptions" aria-labelledby="assumptions-title">
            <div className="section-kicker">
              <span className="eyebrow">Keep the interpretation honest</span>
            </div>
            <h2 id="assumptions-title">The definitions matter, too.</h2>
            <div className="assumption-cards">
              <article>
                <span className="eyebrow">Observer convention</span>
                <h3>
                  Same terrain.
                  <br />
                  Different observer.
                </h3>
                <p className="assumption-value">
                  {fixed(fixedSdem.simultaneous.days.value)} <span>→</span>{' '}
                  {fixed(surfaceSdem.simultaneous.days.value)} <small>days</small>
                </p>
                <p>
                  Product 104 at the common absolute elevation versus 2 m above its ground. The
                  first observer is only {fixed(fixedSdem.aboveGround.value, 3)} m above that
                  represented surface.
                </p>
                <a href="/explain/?comparison=observer-P104_5m-uncensored_intersecting_registered&metric=simultaneous">
                  Inspect the observer comparison <Arrow />
                </a>
              </article>
              <article>
                <span className="eyebrow">Reporting domain</span>
                <h3>
                  A cutoff
                  <br />
                  is not a sunset.
                </h3>
                <p className="assumption-value">
                  {fixed(clipped.simultaneous.days.value)} <span>→</span>{' '}
                  {fixed(initial.simultaneous.days.value)} <small>days</small>
                </p>
                <p>
                  Nominal Product 78: clipped at 28 November 00:00 UTC versus the complete episode.
                  The clipped value is not a physical 6.5-day mission-failure claim.
                </p>
                <a href="/explain/?comparison=domain-P78_5m-fixed_absolute&metric=simultaneous">
                  Inspect the reporting boundary <Arrow />
                </a>
              </article>
              <article>
                <span className="eyebrow">Negative evidence / dGR203</span>
                <h3>
                  An audit can preserve
                  <br />
                  the tested decision.
                </h3>
                <p className="assumption-value">
                  5 <span>of</span> 5 <small>clones</small>
                </p>
                <p>
                  All five tested local clones retained the historical 6.5-day simultaneous
                  classification in the separate seasonal pilot. This does not establish universal
                  stability or a calibrated probability.
                </p>
                <a href="/science/#control">
                  Inspect the negative finding <Arrow />
                </a>
              </article>
            </div>
            <div className="audit-end">
              <p>
                Inspect the opportunity.
                <br />
                <strong>Then audit the answer.</strong>
              </p>
              <div>
                <a className="secondary-button" href="/science/">
                  Open the evidence <Arrow />
                </a>
                <a href="/demo/">
                  Guided demonstration <Arrow />
                </a>
              </div>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
      <EvidenceDrawer
        data={data}
        result={audited ? result : initial}
        model={audited ? model : data.representations.find((m) => m.id === data.defaults.id)!}
        witness={
          audited
            ? witness
            : data.witnesses.find(
                (w) =>
                  w.id === data.defaults.id &&
                  w.observer === data.defaults.observer &&
                  w.diagnostic === 'own_late_solar_onset',
              )!
        }
        open={evidence}
        onClose={() => setEvidence(false)}
      />
    </>
  );
}
