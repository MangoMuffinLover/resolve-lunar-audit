import { ResearchJourney } from '@/components/research-journey';
import { EvidenceIndex } from '@/components/evidence-index';
import { SiteHeader, SiteFooter } from '@/components/site-header';
import raw from '@/data/science.v1.json';
import type { ScienceData } from '@/lib/science-contract';
import { ControlExample } from '@/components/control-example';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'RESOLVE — Science & Evidence',
  description:
    'Inspect the negative control, recorded protocols, NASA terrain provenance, numerical validation and limits behind RESOLVE’s representation audit.',
};
const data = raw as unknown as ScienceData;
function SourceLink({ id, children }: { id: string; children?: ReactNode }) {
  return (
    <a href={data.sources[id].href} download>
      {children || data.sources[id].label}
    </a>
  );
}
export default function Page() {
  const v = data.validation;
  return (
    <>
      <a href="#science-main" className="skip-link">
        Skip to science and evidence
      </a>
      <SiteHeader active="evidence" context="Science & evidence" />
      <main id="science-main" className="science-main">
        <div className="science-intro">
          <p className="eyebrow">Inspect the evidence</p>
          <h1>What does the evidence support?</h1>
          <p>
            RESOLVE audits whether a modeled lunar visibility result survives defensible modeling
            choices. The evidence includes a negative result, a large representation response, and
            limits on what either can establish.
          </p>
        </div>
        <ResearchJourney />
        <div className="evidence-overview">
          <article>
            <span className="eyebrow">The measured response</span>
            <strong>+{v.effect.value.toFixed(2)} days</strong>
            <p>
              Native 5 m → 80 m at dGR101, under a common absolute observer. A modeled response, not
              an accuracy ranking.
            </p>
          </article>
          <article>
            <span className="eyebrow">The negative finding</span>
            <strong>5 tested clones</strong>
            <p>
              The limited dGR203 pilot preserved the specified research classification. This does
              not establish universal stability.
            </p>
          </article>
          <article>
            <span className="eyebrow">What is not established</span>
            <strong>Terrain truth</strong>
            <p>
              No independent physical accuracy, fine-grid plateau or mission certification is
              claimed.
            </p>
          </article>
        </div>
        <div className="evidence-packet">
          <p>Follow each finding back to the retained source.</p>
          <a className="secondary-button" href="/evidence/science/review-packet.v1.json" download>
            Download the review packet <span aria-hidden="true">↓</span>
          </a>
        </div>
        <EvidenceIndex />
        <details id="findings" className="evidence-chapter">
          <summary>
            <span className="chapter-number">01</span>
            <span>
              <strong>Findings & research progression</strong>
              <small>The question changed with the evidence</small>
            </span>
            <span className="chapter-toggle" aria-hidden="true">
              +
            </span>
          </summary>
          <section className="science-section">
            <h2>The research changed the question.</h2>
            <ol className="science-studies">
              {data.studies.map((s) => (
                <li key={s.id}>
                  <p className="eyebrow">
                    {s.id} · {s.site}
                  </p>
                  <h3>{s.title}</h3>
                  <p>{s.finding}</p>
                  <p className="science-study-limit">{s.limit}</p>
                  <div className="science-links">
                    <SourceLink id={s.findingSource}>Read the finding</SourceLink>
                    <SourceLink id={s.protocolSource}>Read the retained protocol</SourceLink>
                  </div>
                </li>
              ))}
            </ol>
            <p className="science-principal-finding">
              At dGR101, native Product 78 5 m and Product 90 80 m give{' '}
              <strong>7.40 and 12.92 days</strong> of complete simultaneous visibility at the same
              absolute observer. That is a representation response, not an accuracy ranking.
            </p>
            <a href="/explain/">Trace that comparison to its physical mechanism →</a>
          </section>
        </details>
        <details id="control" className="evidence-chapter">
          <summary>
            <span className="chapter-number">02</span>
            <span>
              <strong>Negative evidence / dGR203</strong>
              <small>Limited seasonal pilot and separate modeling checks</small>
            </span>
            <span className="chapter-toggle" aria-hidden="true">
              +
            </span>
          </summary>
          <ControlExample
            embedded
            data={{
              control: data.control,
              sources: {
                pilot: data.sources.pilot,
                'b-ladder': data.sources['b-ladder'],
                'a-finding': data.sources['a-finding'],
              },
            }}
          />
        </details>
        <details id="method" className="evidence-chapter">
          <summary>
            <span className="chapter-number">03</span>
            <span>
              <strong>Method & geometry</strong>
              <small>Protocols, frames and analysis definitions</small>
            </span>
            <span className="chapter-toggle" aria-hidden="true">
              +
            </span>
          </summary>
          <section className="science-section">
            <p className="eyebrow">Method & assumptions</p>
            <h2>Hold the question still. Change one modeling choice.</h2>
            <ol className="science-method">
              <li>
                <strong>Record the question and controls.</strong> Retain the protocols, site,
                observer convention, visibility criterion, date domain and research benchmarks
                before interpreting outcomes.
              </li>
              <li>
                <strong>Use traceable terrain representations.</strong> Compare native NASA grids
                within one common 20 × 20 km local footprint. Keep the 80 m / 240 m exterior
                continuation fixed. Pixel spacing does not mean uniform pole-wide coverage.
              </li>
              <li>
                <strong>Construct the geometric horizon.</strong> Use bilinear DEM interpolation,
                spherical curvature and sampled horizon rays. Geometric visibility requires a body’s
                center above the represented skyline; it is not a power or radio-link prediction.
              </li>
              <li>
                <strong>Refine event boundaries.</strong> Keep reporting-domain clipping separate
                from complete transition-bounded episodes intersecting that domain. Preserve the
                late solar episode separately from the longest solar episode.
              </li>
              <li>
                <strong>Test numerics and retain counterexamples.</strong> Compare spatial, temporal
                and range refinements before interpreting model effects. Preserve the negative
                result and unresolved historical discrepancy.
              </li>
            </ol>
            <dl className="science-definitions">
              <dt>Frame / ephemeris</dt>
              <dd>
                {data.geometry.frame} / {data.geometry.translation}
              </dd>
              <dt>SPICE aberration convention</dt>
              <dd>{data.geometry.aberration} · geometric centers</dd>
              <dt>Lunar reference sphere</dt>
              <dd>{data.geometry.radius.value.toLocaleString('en-US')} m radius</dd>
              <dt>dGR101 source point</dt>
              <dd>
                {data.geometry.latitude.original}° latitude, {data.geometry.longitude.original}°
                east longitude
              </dd>
              <dt>dGR203 source point</dt>
              <dd>
                Published rounded point: 88.141° S, 71.696° W. Separate from the archived dGR101
                point.
              </dd>
              <dt>R-01C observer conventions</dt>
              <dd>
                Common absolute elevation, or exactly 2 m above each represented ground. The latter
                also updates celestial observer position.
              </dd>
              <dt>Registered domain</dt>
              <dd>[2026-11-06 00:00, 2026-11-28 00:00 UTC)</dd>
              <dt>Complete-episode diagnostic envelope</dt>
              <dd>
                [2026-10-19 00:00, 2026-12-13 00:00 UTC). Only episodes intersecting the registered
                domain enter the reported complete results.
              </dd>
            </dl>
            <p className="science-small">
              The archived protocols document pre-outcome controls. This page does not claim
              third-party preregistration certification. The 6.5-day simultaneous benchmark and
              10-day solar screen are separate historical research criteria.
            </p>
            <div className="science-links">
              <SourceLink id="c-protocol" />
              <SourceLink id="frame-audit" />
              <SourceLink id="a-method" />
            </div>
          </section>
        </details>
        <details id="validation" className="evidence-chapter">
          <summary>
            <span className="chapter-number">04</span>
            <span>
              <strong>Numerical validation</strong>
              <small>Acceptance checks and their limits</small>
            </span>
            <span className="chapter-toggle" aria-hidden="true">
              +
            </span>
          </summary>
          <section className="science-section">
            <p className="eyebrow">Saved scientific checks</p>
            <h2>Numerical agreement has a defined scope.</h2>
            <div className="science-validation-grid">
              <article>
                <h3>{v.spatial.value.toFixed(3)} s</h3>
                <strong>Largest accepted spatial refinement change</strong>
                <p>
                  Across {v.spatialChecks} retained metric checks. The protocol aimed for ≤60 s with
                  a 600 s hard ceiling, invariant relevant episode counts and threshold states. The
                  preferred 60 s target was not achieved everywhere.
                </p>
                <SourceLink id="c-ladder">Inspect all refinement checks</SourceLink>
              </article>
              <article>
                <h3>{v.temporal.value.toFixed(6)} s</h3>
                <strong>Largest temporal refinement change</strong>
                <p>
                  Across {v.temporalChecks} checks comparing 150 s and 75 s discovery with event
                  refinement. Relevant event counts agree. This is solver consistency under the
                  model, not physical timing accuracy.
                </p>
                <SourceLink id="c-summary">Inspect the saved summary</SourceLink>
              </article>
              <article>
                <h3>{v.effect.value.toFixed(6)} days</h3>
                <strong>Native 5 m → 80 m representation contrast</strong>
                <p>
                  Complete simultaneous visibility, dGR101, fixed absolute observer. This effect is
                  much larger than the accepted numerical residuals. These residuals do not quantify
                  physical prediction uncertainty.
                </p>
                <SourceLink id="response">Inspect the exact result CSV</SourceLink>
              </article>
            </div>
            <details className="science-detail">
              <summary>Range, seam and final verification checks</summary>
              <ul>
                <li>
                  {v.cutoffChecks} saved 150 / 200 km cutoff configurations compared with the 250 km
                  reference passed their scoped checks. Some horizon samples differ; the selected
                  longest-interval conclusions did not change.
                </li>
                <li>
                  The saved critical-witness audit found no controlling witness within one local
                  pixel of the replacement boundary. This is a seam check for these witnesses, not a
                  general coverage proof.
                </li>
                <li>
                  The saved final verification checked {v.savedVerification.response_rows} result
                  rows and {v.savedVerification.strict_json_files_checked} strict JSON files. Scoped
                  threshold flags and source-solution agreement passed the recorded checks.
                </li>
                <li>
                  R-01C preserved {v.savedVerification.frozen_r01ab_files_unchanged} R-01A/B files.
                  The product build separately verifies {data.integrity.files} files in its frozen
                  baseline.
                </li>
              </ul>
              <div className="science-links">
                <SourceLink id="c-numerical" />
                <SourceLink id="c-verification" />
              </div>
            </details>
            <aside className="science-caution">
              <strong>Still unknown: independent physical accuracy.</strong>
              <p>
                A fine-grid duration plateau has not been demonstrated. Exact DE441 comparison was
                not run, and its effect is unknown. DE440 is not substituted for DE441. The
                inherited historical QTS configuration has not been validated.
              </p>
              <SourceLink id="frame-audit">Read the frame and ephemeris limitations</SourceLink>
            </aside>
          </section>
        </details>
        <details id="provenance" className="evidence-chapter">
          <summary>
            <span className="chapter-number">05</span>
            <span>
              <strong>NASA products & support</strong>
              <small>Source identity and hash scope</small>
            </span>
            <span className="chapter-toggle" aria-hidden="true">
              +
            </span>
          </summary>
          <section className="science-section">
            <p className="eyebrow">NASA data & provenance</p>
            <h2>Different representations. Traceable bytes.</h2>
            <p>
              Native NASA grids, the separate SDEM branch, and the synthetic control keep distinct
              identities. Raster hashes identify the evaluated bytes. Native-window and range hashes
              do not establish a whole remote-file digest.
            </p>
            <div className="science-products">
              {data.products.map((p) => (
                <article key={p.id}>
                  <p className="eyebrow">
                    {p.kind === 'native-lola'
                      ? 'Native LOLA grid'
                      : p.kind === 'separate-sdem'
                        ? 'Separate SDEM branch'
                        : 'Synthetic control'}
                  </p>
                  <h3>{p.label}</h3>
                  <p>
                    {p.spacing_m.toFixed(p.kind === 'synthetic-control' ? 5 : 0)} m pixel spacing.{' '}
                    {p.description}
                  </p>
                  {p.nasaUrl ? (
                    <a href={p.nasaUrl} target="_blank" rel="noreferrer">
                      NASA product documentation ↗
                    </a>
                  ) : (
                    <p className="science-small">
                      Derived by area averaging the nominal grid; not a native NASA 60 m product.
                    </p>
                  )}
                  <details>
                    <summary>Evaluated raster & hash scope</summary>
                    <p className="science-path">{p.raster}</p>
                    <p>{p.hashScope}.</p>
                    <code className="science-hash">{p.sha256 || 'Unknown'}</code>
                  </details>
                </article>
              ))}
            </div>
            <p className="science-small">
              Outside the replacement footprint: {data.footprint}. Original source pixels are
              retained without resampling into a new allegedly native grid. Native product lineages
              and alignments differ.
            </p>
            <details className="science-detail">
              <summary>Exact SPICE kernels and retained checksums</summary>
              <p>
                Kernel filenames alone do not define the model. These retained hashes identify the
                inputs used by the recorded DE421 cartographic chain.
              </p>
              <ul>
                {data.kernels.map((k) => (
                  <li key={k.path}>
                    {k.url ? (
                      <a href={k.url} target="_blank" rel="noreferrer">
                        {k.path.split('/').pop()} ↗
                      </a>
                    ) : (
                      k.path
                    )}
                    <span className="science-small">
                      {' '}
                      · {k.bytes.toLocaleString('en-US')} bytes
                    </span>
                    <code className="science-hash">{k.sha256}</code>
                  </li>
                ))}
              </ul>
            </details>
            <aside className="science-caution">
              <strong>Support metadata is descriptive.</strong>
              <p>
                LOLA count/error and Product 104 mask, best-image-resolution and difference products
                help describe support. They do not calibrate truth probability or guaranteed
                measurement benefit. Product 104 SIGM filename mapping remains inferred.
              </p>
              <SourceLink id="source-audit">Read the source and support audit</SourceLink>
            </aside>
          </section>
        </details>
        <details id="limits" className="evidence-chapter">
          <summary>
            <span className="chapter-number">06</span>
            <span>
              <strong>Limits & unresolved questions</strong>
              <small>What the evidence cannot establish</small>
            </span>
            <span className="chapter-toggle" aria-hidden="true">
              +
            </span>
          </summary>
          <section className="science-section">
            <p className="eyebrow">Interpretation limits</p>
            <h2>A precise number is not necessarily a stable decision.</h2>
            <ul className="science-limits">
              <li>
                <strong>Representation response:</strong> different products and observer
                conventions can change a modeled answer. No product is designated terrain truth;
                finer pixel spacing does not certify accuracy.
              </li>
              <li>
                <strong>Scoped stability:</strong> dGR203’s tested decision can remain unchanged
                while durations and Earth-only results change. This does not establish stability at
                dGR101 or every lunar site.
              </li>
              <li>
                <strong>Censoring:</strong> the roughly 5.4-day registered nominal value is clipped.
                It must not become a claim of a physical 6.5-day mission failure; its complete R-01C
                simultaneous episode is about 7.40 days.
              </li>
              <li>
                <strong>Limited uncertainty coverage:</strong> the first-five local-clone pilot is
                not a calibrated distribution. Exterior terrain, shared biases and all systematic
                errors are not sampled.
              </li>
              <li>
                <strong>Geometry only:</strong> geometric center visibility omits mission power
                storage, radiance, eclipsing-source effects and communications link budgets.
                Finite-disc criteria in R-01B are changed observables with their own limits.
              </li>
              <li>
                <strong>Historical replication:</strong> 12-hour increment counting explains part of
                the seven-versus-8.47-day gap; a one-day residual and inconsistent archived raster
                semantics remain unresolved. A diagnostic that produces seven days is not proof of
                the original authors’ implementation.
              </li>
              <li>
                <strong>Product verification:</strong> automated checks do not establish terrain
                accuracy, accessibility certification or human comprehension. The uncoached
                twenty-second judge test and dedicated screen-reader review remain outstanding.
              </li>
            </ul>
            <div className="science-links">
              <SourceLink id="literature-audit" />
              <SourceLink id="c-finding" />
              <SourceLink id="limitations" />
            </div>
          </section>
        </details>
        <details id="reproduce" className="evidence-chapter">
          <summary>
            <span className="chapter-number">07</span>
            <span>
              <strong>Sources & reproduction</strong>
              <small>Exact records and research requirements</small>
            </span>
            <span className="chapter-toggle" aria-hidden="true">
              +
            </span>
          </summary>
          <section className="science-section">
            <p className="eyebrow">Reproducibility</p>
            <h2>Follow a claim back to its source.</h2>
            <p>
              The review packet lists frozen source hashes, exact downloads, numerical summaries,
              raster identity and kernel inputs. It supports checking the displayed evidence. It is
              not the complete research environment or the original DEM collection.
            </p>
            <div className="science-links">
              <a href={data.integrity.href} download>
                Download frozen source hashes
              </a>
              <SourceLink id="response">Exact R-01C results</SourceLink>
              <SourceLink id="pilot">Exact clone pilot</SourceLink>
              <SourceLink id="b-ladder">Exact R-01B factor table</SourceLink>
            </div>
            <ol className="science-method">
              <li>
                <strong>Inspect without rerunning science.</strong> Compare the exact CSV row or
                JSON pointer with the displayed value. Check the downloaded file’s SHA-256 against
                this packet. Retained hashes check byte identity, not independent physical validity.
              </li>
              <li>
                <strong>Rebuild the product from retained evidence.</strong> In a complete research
                workspace, install the pinned web dependencies, run the build, and serve the static
                export. The build verifies the frozen baseline and packages derived display records.
                It does not rerun terrain horizons or event solutions.
              </li>
              <li>
                <strong>Reproduce the research separately.</strong> Use a separate workspace copy
                with the verified raw rasters, kernel inputs, research environment and retained
                R-01A/B artifacts. Follow the original R-01C instructions; heavy raster processes
                run sequentially. Full raw data and environment files are required beyond this
                review packet.
              </li>
            </ol>
            <details className="science-detail">
              <summary>Product commands and original research instructions</summary>
              <p>
                From the existing <code>web/</code> directory in the complete research workspace:
              </p>
              <pre>
                <code>
                  {
                    'npm ci\nnpm run build\nnpm run preview\n\n# Verify retained evidence and product behavior\nnpm run verify:science\nnpm test\nnpm run test:e2e'
                  }
                </code>
              </pre>
              <p>
                Build requires the existing research Python environment or{' '}
                <code>RESOLVE_PYTHON</code>. Browser checks require the local preview and installed
                Edge. The static export serves without research inputs.
              </p>
              <SourceLink id="c-reproduce">
                Download the original research reproduction guide
              </SourceLink>
              <p className="science-small">
                The original guide records the completed experiment’s execution and its stopping
                gate. Reading or rebuilding this product does not rerun that experiment.
              </p>
            </details>
            <details className="science-detail">
              <summary>Source register: paths, bytes and SHA-256</summary>
              <ul className="science-register">
                {Object.entries(data.sources).map(([id, s]) => (
                  <li key={id}>
                    <SourceLink id={id} />
                    <p className="science-path">
                      {s.path} · {s.bytes.toLocaleString('en-US')} bytes
                    </p>
                    <code className="science-hash">{s.sha256}</code>
                  </li>
                ))}
              </ul>
              <p className="science-small">
                Research manifest identity:{' '}
                <code className="science-hash">{data.researchManifest.sha256}</code> at{' '}
                {data.researchManifest.path}. Product review-packet generator:{' '}
                <code className="science-hash">{data.generator.sha256}</code>. A matching hash is an
                integrity check, not an external signature.
              </p>
            </details>
          </section>
        </details>
      </main>
      <SiteFooter />
    </>
  );
}
