'use client';
import { useEffect, useState } from 'react';
import type { DemoData } from '@/lib/demo-contract';
import type { FactorRecord } from '@/lib/factor-contract';
import { verifiedJSON } from '@/lib/verified-json';
import { controlRows } from '@/lib/science-contract';

export default function DemoNegative({
  data,
}: {
  data: Pick<DemoData, 'control' | 'pilotSource'>;
}) {
  const [record, setRecord] = useState<FactorRecord | null>(null);
  const [failed, setFailed] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setFailed(false);
    verifiedJSON<FactorRecord>(data.control, 'resolve.factors.site.v1')
      .then((value) => {
        if (value.site !== 'dGR203' || controlRows(value, 'pilot').length !== 5)
          throw new Error('Demo control identity mismatch');
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
  if (failed)
    return (
      <div role="alert" className="demo-error">
        <p>
          The dGR203 pilot record could not be verified. No clone range or classification is shown.
        </p>
        <button className="secondary-button" onClick={() => setRetry((n) => n + 1)}>
          Retry demo control
        </button>
        <a href="/science/#control">Inspect the control study</a>
      </div>
    );
  if (!record) return <p role="status">Verifying the negative-control evidence…</p>;
  const rows = controlRows(record, 'pilot');
  const values = rows.map((r) => record.measurements[r.values.simultaneous.after].days);
  const nominal = record.measurements[rows[0].values.simultaneous.before].days;
  const passed = values.filter((d) => d >= 6.5).length;
  return (
    <div data-testid="demo-negative">
      <p className="demo-context">
        dGR203 · R-01A seasonal search, 1 October–15 December 2026 UTC · geometric centers
      </p>
      <div className="demo-pair">
        <div>
          <p>Nominal longest simultaneous window</p>
          <p className="demo-number-small">{nominal.toFixed(6)} days</p>
        </div>
        <div>
          <p>Five tested official clones</p>
          <p className="demo-number-small">
            {Math.min(...values).toFixed(6)}–{Math.max(...values).toFixed(6)} days
          </p>
        </div>
      </div>
      <p className="demo-takeaway">
        <strong>
          {passed} of {values.length} tested clones
        </strong>{' '}
        retained the historical 6.5-day simultaneous classification.
      </p>
      <p>
        The original local terrain-uncertainty hypothesis was not supported for this tested
        decision. Durations still changed. Five local clones do not establish universal stability or
        a calibrated probability.
      </p>
      <p className="demo-limit">
        The roughly 13.23-day seasonal pilot is separate from the roughly 8.47-day registered
        replication result and the selected fixed-start operational grid.
      </p>
      <div className="demo-links">
        <a href="/science/#control">Inspect the control and its limits →</a>
        <a href={data.pilotSource.href} download>
          Download the exact pilot CSV
        </a>
      </div>
    </div>
  );
}
