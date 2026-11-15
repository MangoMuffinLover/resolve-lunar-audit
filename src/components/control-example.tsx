'use client';
import { useEffect, useState } from 'react';
import type { ScienceData } from '@/lib/science-contract';
import { benchmarkState, controlRows } from '@/lib/science-contract';
import type { AuditMetric, FactorRecord } from '@/lib/factor-contract';
import { formatEffect } from '@/lib/factor-contract';
import { verifiedJSON } from '@/lib/verified-json';

export function ControlExample({
  data,
  embedded = false,
}: {
  data: Pick<ScienceData, 'control' | 'sources'>;
  embedded?: boolean;
}) {
  const [record, setRecord] = useState<FactorRecord | null>(null);
  const [failed, setFailed] = useState(false),
    [retry, setRetry] = useState(0);
  const [study, setStudy] = useState<'pilot' | 'modeling'>('pilot');
  const [metric, setMetric] = useState<AuditMetric>('simultaneous');
  useEffect(() => {
    let active = true;
    setFailed(false);
    verifiedJSON<FactorRecord>(data.control, 'resolve.factors.site.v1')
      .then((value) => {
        if (value.site !== 'dGR203') throw new Error('Control identity mismatch');
        if (active) setRecord(value);
      })
      .catch(() => {
        if (active) {
          setRecord(null);
          setFailed(true);
        }
      });
    return () => {
      active = false;
    };
  }, [data.control, retry]);
  const rows = record ? controlRows(record, study) : [];
  const baseline =
    record && rows.length ? record.measurements[rows[0].values[metric].before] : null;
  return (
    <section
      id={embedded ? undefined : 'control'}
      className="science-section"
      aria-labelledby="control-title"
    >
      <p className="eyebrow">Negative evidence / dGR203</p>
      <h2 id="control-title">A valid audit can preserve the decision.</h2>
      <p>
        The first local terrain-uncertainty hypothesis was not supported for the evaluated 6.5-day
        simultaneous-center decision. Duration changes still occurred. Inspect the limited pilot and
        the later modeling checks in their own domains.
      </p>
      <div className="science-controls">
        <label>
          Study scope
          <select
            value={study}
            onChange={(e) => setStudy(e.target.value as 'pilot' | 'modeling')}
            data-testid="control-study"
          >
            <option value="pilot">R-01A — first five official clones</option>
            <option value="modeling">R-01B — registered modeling checks</option>
          </select>
        </label>
        <label>
          Observable
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as AuditMetric)}
            data-testid="control-metric"
          >
            <option value="simultaneous">Sun & Earth together</option>
            <option value="sun">Sun only</option>
            <option value="earth">Earth only</option>
          </select>
        </label>
      </div>
      <div className="science-scope" data-testid="control-scope" aria-live="polite">
        {study === 'pilot' ? (
          <>
            <strong>Seasonal search: 1 October–15 December 2026 UTC.</strong>
            <p>
              First five clones in source order. Horizon rays originate 2 m above each represented
              ground; nominal celestial geometry and exterior terrain are fixed. Geometric centers,
              600-second event discovery with refinement.
            </p>
            <p>
              Five local perturbations do not sample far-field or all systematic uncertainty. They
              are not a calibrated probability distribution.
            </p>
          </>
        ) : (
          <>
            <strong>Registered reporting domain: [6 November, 28 November 2026 UTC).</strong>
            <p>
              The nominal control is 2 m above Product 78 ground, using DE421 / MOON_ME_DE421.
              Terrain, height, finite-disc acceptance, sampling and reporting endpoints change
              separately, with the qualification beside each exact comparison.
            </p>
            <p>
              These approximately 8.47-day results are separate from the approximately 13.23-day
              seasonal pilot. Clipped durations are not complete physical episodes.
            </p>
          </>
        )}
      </div>
      {failed ? (
        <div role="alert" className="science-error">
          <p>
            The dGR203 control record could not be verified. No control result or classification is
            shown.
          </p>
          <button className="secondary-button" onClick={() => setRetry((n) => n + 1)}>
            Retry control evidence
          </button>
        </div>
      ) : !record ? (
        <p role="status">Verifying the dGR203 control evidence…</p>
      ) : (
        baseline && (
          <>
            <p className="science-control-result" data-testid="control-baseline">
              <strong>{baseline.days.toFixed(6)} days</strong> · nominal{' '}
              {metric === 'simultaneous'
                ? 'simultaneous'
                : metric === 'sun'
                  ? 'solar'
                  : 'Earth-only'}{' '}
              control
            </p>
            <p className="science-small">
              Benchmarks are historical research criteria: 6.5 days simultaneous and 10 days solar.
              There is no corresponding Earth-only benchmark. These labels do not certify mission
              feasibility.
            </p>
            <div
              className="science-table-scroll"
              role="region"
              tabIndex={0}
              aria-label="dGR203 source-backed comparisons; scroll horizontally on small screens"
            >
              <table className="science-control-table" data-testid="control-table">
                <caption>
                  {study === 'pilot' ? 'Five tested clones' : 'Twelve separate modeling checks'} ·{' '}
                  {metric} · changes relative to the stated nominal control
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Tested change</th>
                    <th scope="col">Duration (days)</th>
                    <th scope="col">Change</th>
                    <th scope="col">Research criterion</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const pair = row.values[metric],
                      after = record.measurements[pair.after];
                    const query = new URLSearchParams({
                      site: 'dGR203',
                      factor: row.factor,
                      metric,
                      comparison: row.id,
                    });
                    return (
                      <tr key={row.id}>
                        <th scope="row">
                          <a href={`/factors/?${query}`}>{row.label}</a>
                        </th>
                        <td>
                          {after.days.toFixed(6)}
                          {after.leftCensored.value || after.rightCensored.value ? (
                            <span className="science-clipped"> · clipped</span>
                          ) : null}
                        </td>
                        <td>{formatEffect(pair.deltaDays)}</td>
                        <td>{benchmarkState(metric, after.days)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <details className="science-detail">
              <summary>Exact control values, source rows and study limits</summary>
              <p>
                {study === 'pilot'
                  ? 'The pilot preserved the 6.5-day simultaneous classification for all five clones. This is a limited negative result, not universal stability. The nominal seasonal result is not especially close to the threshold.'
                  : 'The tested R-01B simultaneous benchmark and solar screen retain their respective classifications here. Larger Earth-only changes and changes in the observable must not be hidden by a single stable label.'}
              </p>
              <p>
                Nominal duration:{' '}
                <code>
                  {baseline.duration.original} {baseline.duration.unit}
                </code>{' '}
                · source field <code>{baseline.duration.source.field}</code>, CSV row{' '}
                {baseline.duration.source.row}.
              </p>
              <ul>
                {rows.map((row) => {
                  const m = record.measurements[row.values[metric].after];
                  return (
                    <li key={row.id}>
                      <strong>{row.label}</strong>:{' '}
                      <code>
                        {m.duration.original} {m.duration.unit}
                      </code>{' '}
                      · field <code>{m.duration.source.field}</code>, CSV row{' '}
                      {m.duration.source.row}. {record.scopes[row.scope].qualification}
                    </li>
                  );
                })}
              </ul>
              <a href={data.sources[study === 'pilot' ? 'pilot' : 'b-ladder'].href} download>
                Download the exact study CSV
              </a>
              {' · '}
              <a href={data.control.href} download>
                Download the normalized control record
              </a>
            </details>
          </>
        )
      )}
      <aside className="science-caution">
        <strong>Fixed-start grid: a separate negative result.</strong>
        <p>
          The R-01A selected operational grid had 0 of 90 terrain/state combinations meeting the
          uninterrupted requirement. A season-wide opportunity can coexist with failure at those
          chosen starts. The grid can have low power to detect near-threshold terrain sensitivity.
        </p>
        <a href={data.sources['a-finding'].href} download>
          Read the original negative finding
        </a>
      </aside>
    </section>
  );
}
