'use client';
import dynamic from 'next/dynamic';
import { useCallback, useRef, useState } from 'react';
import type { AuditData, Observer, Domain } from '@/lib/contract';
import { caseKey } from '@/lib/contract';
import { fixed, utc } from '@/lib/format';
import { Timeline } from './timeline';
import { RepresentationLadder } from './representation-ladder';
import { EvidenceDrawer } from './evidence-drawer';
import { SiteHeader, SiteFooter } from './site-header';
import type { AuditPhysics } from './audit-mechanism';
import { AssumptionComparisons, NegativeFinding } from './assumption-comparisons';
import { ModelFracture } from './model-fracture';
import { ResearchJourney } from './research-journey';
import { StoryMotion } from './story-motion';
import { PhysicalReveal } from './physical-reveal';
import type { VisualAssets } from '@/lib/visual-contract';

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

export function DecisionAudit({
  data,
  physics,
  visual,
}: {
  data: AuditData;
  physics: AuditPhysics;
  visual: VisualAssets;
}) {
  const [audited, setAudited] = useState(false),
    [why, setWhy] = useState(false),
    [evidence, setEvidence] = useState(false),
    [detailed, setDetailed] = useState(false);
  const [selected, setSelected] = useState(data.defaults.comparison);
  const [observer, setObserver] = useState<Observer>(data.defaults.observer),
    [domain, setDomain] = useState<Domain>(data.defaults.domain);
  const whyHeading = useRef<HTMLHeadingElement>(null),
    whyPending = useRef(false);
  const initial =
    data.cases[caseKey(data.defaults.id, data.defaults.observer, data.defaults.domain)];
  const result = data.cases[caseKey(selected, observer, domain)];
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
    () =>
      requestAnimationFrame(() => {
        const heading = whyHeading.current;
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
      focusSoon();
    }
  }, [focusSoon]);
  const resetDefinitions = useCallback(() => {
    setObserver('fixed_absolute');
    setDomain('uncensored_intersecting_registered');
  }, []);
  function startAudit() {
    setAudited(true);
  }
  function openWhy() {
    whyPending.current = !why;
    setWhy(true);
    focusSoon();
  }
  return (
    <div className="cinematic-page">
      <a href="#main" className="skip-link">
        Skip to decision audit
      </a>
      <SiteHeader active="audit" />
      <main id="main" className="audit-home">
        <ModelFracture
          data={data}
          visual={visual}
          audited={audited}
          selected={selected}
          observer={observer}
          domain={domain}
          onSelect={setSelected}
          onAudit={startAudit}
          onWhy={openWhy}
          onEvidence={() => setEvidence(true)}
          resetDefinitions={resetDefinitions}
        />
        <StoryMotion revision={`${audited}:${why}`} />
        {audited && (
          <section className="constant-story" data-story aria-labelledby="constant-title">
            <p className="eyebrow">In this shared-time comparison</p>
            <h2 id="constant-title">
              {observer === 'fixed_absolute' ? (
                <>
                  The Sun never moved.
                  <br />
                  <em>The terrain model did.</em>
                </>
              ) : (
                <>
                  Same ephemeris.
                  <br />
                  <em>The observer convention changed.</em>
                </>
              )}
            </h2>
            <p>
              {observer === 'fixed_absolute'
                ? 'Same dGR101 site. Same stored Sun and Earth positions. Same absolute observer. Different evaluated terrain representations.'
                : 'At 2 m above each represented surface, the absolute observer position changes. The geometry follows that observer.'}
            </p>
            <span className="constant-clock">17 NOVEMBER 2026 / 14:30 UTC</span>
          </section>
        )}
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
            <div className="technical-audit-heading">
              <span className="eyebrow">Open the instrument housing</span>
              <h2 id="audit-heading">Audit definitions & exact intervals</h2>
              <a href={factors}>
                Compare modeling choices <span aria-hidden="true">↗</span>
              </a>
              <p>
                The modeled response does not identify which terrain prediction is physically
                correct.
              </p>
            </div>
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
            {selected === 'P90_80m' && observer === 'fixed_absolute' && (
              <PhysicalReveal data={data} visual={visual} />
            )}
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
          <section className="audit-assumptions" aria-labelledby="assumptions-title" data-story>
            <div className="trust-question">
              <p className="eyebrow">So which answer should a planner trust?</p>
              <h2>
                RESOLVE does not choose
                <br />
                <em>a terrain truth.</em>
              </h2>
              <p>
                It reveals whether the modeled decision remains stable under the evaluated choices.
              </p>
            </div>
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
            </div>
            <AssumptionComparisons />
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
      {audited && why && (
        <>
          <NegativeFinding />
          <ResearchJourney />
          <section className="evidence-gate" data-story>
            <p className="eyebrow">Every claim has a trail</p>
            <h2>Open the instrument housing.</h2>
            <div>
              <span>NASA Products 78 / 90 / 104</span>
              <span>SPICE / DE421</span>
              <span>Protocols · validation · limits</span>
            </div>
            <a className="primary-button" href="/science/">
              Open the evidence ↗
            </a>
          </section>
        </>
      )}
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
    </div>
  );
}
