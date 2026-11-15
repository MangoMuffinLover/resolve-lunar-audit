'use client';
import { SiteHeader, SiteFooter } from '@/components/site-header';
import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import { demoSteps } from '@/lib/demo-contract';
import type { DemoData } from '@/lib/demo-contract';
import { fixed, signed, utc } from '@/lib/format';

const Mechanism = dynamic(() => import('./demo-mechanism'), {
  loading: () => <p role="status">Opening the physical explanation…</p>,
});
const Negative = dynamic(() => import('./demo-negative'), {
  loading: () => <p role="status">Opening the negative-control example…</p>,
});

export function GuidedDemo({ data }: { data: DemoData }) {
  const [step, setStep] = useState(0);
  const [observer, setObserver] = useState<'fixed_absolute' | 'each_surface_2m'>('fixed_absolute');
  const heading = useRef<HTMLHeadingElement>(null);
  const selected = demoSteps[step];
  function go(next: number) {
    setStep(Math.max(0, Math.min(demoSteps.length - 1, next)));
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  }
  function restart() {
    setObserver('fixed_absolute');
    go(0);
  }
  const sdem = observer === 'fixed_absolute' ? data.sdemFixed : data.sdemSurface;
  return (
    <>
      <a href="#demo-main" className="skip-link">
        Skip to guided demonstration
      </a>
      <SiteHeader active="audit" context="Guided demo" />
      <main id="demo-main" className="demo-main">
        <p className="eyebrow">PROJECT RESOLVE · Six steps · advance at your own pace</p>
        <nav aria-label="Demonstration steps" className="demo-steps">
          <ol>
            {demoSteps.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  aria-current={step === i ? 'step' : undefined}
                  onClick={() => go(i)}
                >
                  <span>{i + 1}</span>
                  {s.label}
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <article className="demo-panel" aria-labelledby="demo-step-title">
          <p className="demo-step-count" aria-live="polite">
            Step {step + 1} of {demoSteps.length} · {selected.label}
          </p>
          <h1 id="demo-step-title" tabIndex={-1} ref={heading} data-testid="demo-step-title">
            {selected.title}
          </h1>
          {step === 0 && (
            <div data-testid="demo-result">
              <p className="demo-context">
                dGR101 · Product 78 SL2 5 m · geometric Sun & Earth centers
              </p>
              <p className="demo-number">
                {fixed(data.baseline.simultaneous.days.value)} <span>days</span>
              </p>
              <p className="demo-takeaway">
                A precise modeled visibility window. Before relying on it, test whether it survives
                another defensible representation.
              </p>
              <p className="demo-limit">
                Longest complete simultaneous episode intersecting 6–28 November 2026 UTC. Common
                absolute observer elevation. This is geometric visibility, not mission approval.
              </p>
              <details className="demo-details">
                <summary>Exact result and scope</summary>
                <p>
                  {data.baseline.simultaneous.days.original} days ·{' '}
                  {utc(data.baseline.simultaneous.start.value, true)} →{' '}
                  {utc(data.baseline.simultaneous.end.value, true)} UTC, 2026. Neither endpoint is
                  reporting-censored.
                </p>
                <p>
                  Source field <code>{data.baseline.simultaneous.days.source.field}</code>, CSV row{' '}
                  {data.baseline.simultaneous.days.source.row}.
                </p>
                <a href={data.responseSource.href} download>
                  Download the exact result CSV
                </a>
              </details>
            </div>
          )}
          {step === 1 && (
            <div data-testid="demo-audit">
              <p className="demo-classification">
                MODEL-SENSITIVE · this scoped representation comparison
              </p>
              <div className="demo-pair">
                <div>
                  <p>Product 78 · native 5 m</p>
                  <p className="demo-number-small">
                    {fixed(data.baseline.simultaneous.days.value)} days
                  </p>
                </div>
                <div>
                  <p>Product 90 · native 80 m</p>
                  <p className="demo-number-small">
                    {fixed(data.native80.simultaneous.days.value)} days
                  </p>
                </div>
              </div>
              <p className="demo-takeaway">
                <strong>
                  {signed(
                    data.native80.simultaneous.days.value - data.baseline.simultaneous.days.value,
                  )}{' '}
                  days
                </strong>{' '}
                under the same absolute observer and complete-episode definition.
              </p>
              <p>
                The predicted duration responds to the terrain representation. The coarser result is
                not designated more accurate.
              </p>
              <p className="demo-limit">
                The separate Product 104 5 m SDEM gives{' '}
                {fixed(data.sdemFixed.simultaneous.days.value)} days at this absolute observer, only{' '}
                {fixed(data.sdemFixed.aboveGround.value, 3)} m above its represented ground. That
                convention matters in step 4.
              </p>
              <a
                className="demo-deep-link"
                href="/factors/?site=dGR101&factor=terrain&metric=simultaneous&comparison=terrain-P90_80m-fixed_absolute-uncensored_intersecting_registered&observer=fixed_absolute&domain=uncensored_intersecting_registered"
              >
                Inspect the full factor comparison →
              </a>
            </div>
          )}
          {step === 2 && (
            <Mechanism data={{ physical: data.physical, witnesses: data.witnesses }} />
          )}
          {step === 3 && (
            <div data-testid="demo-assumptions">
              <section className="demo-assumption">
                <h2>Observer convention</h2>
                <p>
                  Product 104 is a separate 5 m SDEM branch. Keep its terrain fixed and change the
                  observer definition.
                </p>
                <label className="demo-select">
                  Observer definition
                  <select
                    value={observer}
                    onChange={(e) => setObserver(e.target.value as typeof observer)}
                    data-testid="demo-observer"
                  >
                    <option value="fixed_absolute">Common absolute elevation</option>
                    <option value="each_surface_2m">2 m above this represented ground</option>
                  </select>
                </label>
                <div aria-live="polite" data-testid="demo-observer-result">
                  <p className="demo-number-small">{fixed(sdem.simultaneous.days.value)} days</p>
                  <p>
                    {fixed(sdem.aboveGround.value, 6)} m above represented ground · absolute
                    elevation {fixed(sdem.absoluteHeight.value, 6)} m above the lunar reference
                    sphere
                  </p>
                </div>
              </section>
              <section className="demo-assumption">
                <h2>Reporting domain</h2>
                <p>
                  Nominal Product 78, same geometry:{' '}
                  <strong>{fixed(data.clipped.simultaneous.days.value)} days clipped</strong> at 28
                  November 00:00 UTC, versus{' '}
                  <strong>{fixed(data.baseline.simultaneous.days.value)} complete days</strong>.
                </p>
                <p className="demo-limit">
                  A reporting cutoff does not make the Sun or Earth physically disappear. The
                  clipped value must not become a claim of physical 6.5-day mission failure.
                </p>
              </section>
              <a
                className="demo-deep-link"
                href="/explain/?comparison=observer-P104_5m-uncensored_intersecting_registered&metric=simultaneous"
              >
                Inspect the observer comparison and source geometry →
              </a>
            </div>
          )}
          {step === 4 && (
            <Negative data={{ control: data.control, pilotSource: data.pilotSource }} />
          )}
          {step === 5 && (
            <div data-testid="demo-evidence">
              <p className="demo-takeaway">RESOLVE audits whether the answer survives the model.</p>
              <p>
                Use the navigator to compare supported sites and dates, inspect Sun/Earth
                visibility, then audit the modeled result and trace its controlling assumptions.
              </p>
              <div className="demo-pair">
                <section>
                  <h2>Try the mission question</h2>
                  <p>
                    {data.navigator.sites.join(', ')} · 6–28 November 2026 UTC. Thirty-minute stored
                    snapshots; navigator statistics are clipped to that reporting interval.
                  </p>
                  <a href="/navigator/">Open the Site & Date Navigator →</a>
                </section>
                <section>
                  <h2>Inspect the evidence</h2>
                  <p>
                    Retained protocols, a negative finding, native NASA terrain provenance,
                    numerical checks, and exact source downloads.
                  </p>
                  <a href="/science/">Open Science & Evidence →</a>
                </section>
              </div>
              <details className="demo-details">
                <summary>Numerical checks and remaining limits</summary>
                <p>
                  Largest accepted spatial refinement change:{' '}
                  {fixed(data.validation.spatial.value, 3)} seconds. The preferred 60-second target
                  was not achieved everywhere; the protocol’s hard ceiling was 600 seconds. Largest
                  temporal refinement change: {fixed(data.validation.temporal.value, 6)} seconds.
                </p>
                <p>
                  No fine-grid duration plateau, independent terrain truth or calibrated success
                  probability is established. The historical replication discrepancy remains
                  unresolved. Geometric visibility does not establish power availability or a
                  communications link budget.
                </p>
              </details>
              <div className="demo-links">
                <a href="/evidence/science/review-packet.v1.json" download>
                  Download the source review packet
                </a>
                <a href="/">Explore the full audit →</a>
              </div>
            </div>
          )}
        </article>
        <nav className="demo-controls" aria-label="Advance demonstration">
          <button
            type="button"
            className="secondary-button"
            onClick={() => go(step - 1)}
            disabled={step === 0}
          >
            Previous step
          </button>
          <p>Manual steps · no automatic playback</p>
          {step < demoSteps.length - 1 ? (
            <button type="button" className="primary-button" onClick={() => go(step + 1)}>
              {step === 0 ? 'Audit this result →' : `Next: ${demoSteps[step + 1].label} →`}
            </button>
          ) : (
            <button type="button" className="primary-button" onClick={restart}>
              Restart demonstration
            </button>
          )}
        </nav>
      </main>
      <SiteFooter />
    </>
  );
}
