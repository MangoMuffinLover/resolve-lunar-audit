'use client';
import { useEffect, useRef } from 'react';
import type { AuditData, AuditCase, Datum, Representation, Witness } from '@/lib/contract';

type Entry = { label: string; datum: Datum<number | string | boolean> };
export function EvidenceDrawer({
  data,
  result,
  model,
  witness,
  open,
  onClose,
}: {
  data: AuditData;
  result: AuditCase;
  model: Representation;
  witness: Witness;
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    else if (!open && dialog?.open) dialog.close();
  }, [open]);
  const entries: Entry[] = [
    { label: 'Nominal pixel spacing', datum: model.spacing },
    { label: 'NASA product identifier', datum: model.product },
    { label: 'Simultaneous window duration', datum: result.simultaneous.days },
    { label: 'Interval start', datum: result.simultaneous.start },
    { label: 'Interval end', datum: result.simultaneous.end },
    { label: 'Left censoring', datum: result.simultaneous.leftCensored },
    { label: 'Right censoring', datum: result.simultaneous.rightCensored },
    { label: 'Difference from P78 under the same definitions', datum: result.delta },
    { label: 'Ground at observer', datum: result.ground },
    { label: 'Observer above represented ground', datum: result.aboveGround },
    { label: 'Absolute observer elevation', datum: result.absoluteHeight },
    { label: 'Horizon at nominal solar-onset sector', datum: result.nominalHorizon },
    { label: 'Own late solar-onset azimuth', datum: witness.target_azimuth_deg },
    { label: 'Lower bracketing-ray witness surface range', datum: witness.surface_range_m },
    { label: 'Witness surface elevation', datum: witness.witness_height_m },
    { label: 'Witness source row', datum: witness.source_row },
    { label: 'Witness source column', datum: witness.source_col },
    ...data.support.map((s) => ({ label: `Nominal P78 witness · ${s.label}`, datum: s.datum })),
    {
      label: 'Reported SDEM ground offset at observer',
      datum: data.reportedComparisons.sdemGroundOffset,
    },
    { label: 'Reported aligned comparison range', datum: data.reportedComparisons.alignedRange },
    {
      label: 'Reported 80 m minus 5 m height on aligned ray',
      datum: data.reportedComparisons.aligned80Minus5Height,
    },
    { label: 'Site latitude', datum: data.geometry.latitude },
    { label: 'Site longitude', datum: data.geometry.longitude },
    { label: 'Reference radius', datum: data.geometry.radius },
  ];
  return (
    <dialog
      ref={ref}
      className="evidence-drawer"
      aria-labelledby="evidence-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="drawer-shell">
        <div className="drawer-heading">
          <div>
            <p className="eyebrow">Scientific record · R-01C</p>
            <h2 id="evidence-title">Result evidence.</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close scientific evidence">
            ×
          </button>
        </div>
        <p>
          Frozen results for <strong>{model.label}</strong>. Every value below keeps its original
          source value, units and location.
        </p>
        <div className="evidence-context">
          <span>
            {result.observer === 'fixed_absolute'
              ? 'Fixed absolute elevation'
              : '2 m above each represented surface'}
          </span>
          <span>{data.domains[result.domain].label}</span>
          <span>{data.semantics}</span>
        </div>
        <section aria-labelledby="exact-title">
          <h3 id="exact-title">Exact values & provenance</h3>
          <div className="exact-values">
            {entries.map(({ label, datum }) => {
              const source = data.sources[datum.source.sourceId];
              return (
                <details className="evidence-entry" key={label}>
                  <summary>
                    <span>{label}</span>
                    <code>
                      {datum.original || '(empty source field)'} <small>{datum.unit}</small>
                    </code>
                  </summary>
                  <dl>
                    <dt>Artifact</dt>
                    <dd>{source.path}</dd>
                    <dt>Location</dt>
                    <dd>
                      {datum.source.row
                        ? `CSV record ${datum.source.row} (header = record 1)`
                        : datum.source.line
                          ? `Text line ${datum.source.line}`
                          : `JSON ${datum.source.pointer}`}
                    </dd>
                    <dt>Field</dt>
                    <dd>{datum.source.field}</dd>
                    <dt>Experiment</dt>
                    <dd>{source.experiment}</dd>
                    <dt>SHA-256</dt>
                    <dd className="hash">{source.sha256}</dd>
                  </dl>
                </details>
              );
            })}
          </div>
        </section>
        <section>
          <h3>Representation & geometry</h3>
          <p>{model.description}</p>
          <dl className="source-definition">
            <dt>Source raster</dt>
            <dd>{model.sourceRaster}</dd>
            <dt>Source SHA-256</dt>
            <dd className="hash">
              {model.rasterSha256 ??
                'Synthetic control; see ladder configuration and frozen manifest.'}
            </dd>
            <dt>Frame / ephemeris</dt>
            <dd>
              {data.geometry.frame} / {data.geometry.translation}
            </dd>
            <dt>Aberration correction</dt>
            <dd>{data.geometry.aberration}</dd>
            <dt>Observable</dt>
            <dd>
              Geometric center clearance. Finite-disc and operational constraints are outside this
              result.
            </dd>
          </dl>
        </section>
        <section>
          <h3>Source records</h3>
          <div className="source-links">
            {data.links.map((link) => (
              <a href={link.url} key={link.url} target="_blank" rel="noreferrer">
                {link.label} ↗
              </a>
            ))}
            <a href={data.sources.response.href} download>
              Download exact result CSV ↓
            </a>
            <a href={data.sources.intervals.href} download>
              Download frozen interval records ↓
            </a>
            <a href={data.sources.finding.href} target="_blank" rel="noreferrer">
              Read R-01C finding ↗
            </a>
          </div>
          <details>
            <summary>Horizon and profile source mapping</summary>
            <p>
              Skyline samples retain each original witness index, azimuth and elevation. Terrain
              sections retain each original range/height sample index. Dense samples are display
              points, not independent observations.
            </p>
            <dl className="source-definition">
              <dt>Selected skyline</dt>
              <dd>
                {
                  data.sources[data.profileFiles[`${model.id}_${result.observer}`].source.sourceId]
                    .path
                }
              </dd>
              <dt>Skyline fields</dt>
              <dd>/witnesses/[original index]/azimuth_deg and horizon_elevation_deg</dd>
              <dt>Terrain sections</dt>
              <dd>
                {data.sources.mechanism.path} · /profiles/[profile index]/range_m and height_m
              </dd>
              <dt>Profile source SHA-256</dt>
              <dd className="hash">{data.sources.mechanism.sha256}</dd>
            </dl>
          </details>
        </section>
        <section id="science-history">
          <h3>The research changed the question.</h3>
          <p>
            <a href="/science/">Inspect the control example, methodology and validation →</a>
          </p>
          <ol className="science-history">
            <li>
              <strong>R-01A · A negative result</strong>
              <p>
                The original local terrain-uncertainty hypothesis was not supported at dGR203 for
                the tested decision. The negative control is part of the evidence.
              </p>
              <a href={data.sources.historyA.href} target="_blank" rel="noreferrer">
                Original finding ↗
              </a>
            </li>
            <li>
              <strong>R-01B · A different sensitivity</strong>
              <p>
                Model-form sensitivity emerged, especially at dGR101. The separate historical dGR203
                replication gap remained unresolved.
              </p>
            </li>
            <li>
              <strong>R-01C · Native products tested</strong>
              <p>
                The large dGR101 representation response survived native NASA terrain products.
                Removing domain clipping changed the earlier threshold interpretation.
              </p>
            </li>
          </ol>
        </section>
        <section>
          <h3>What this evidence supports</h3>
          <p>
            {data.classificationScope} Duration differences describe model response; they do not
            establish which terrain representation is physically closest to the Moon.
          </p>
          <ul>
            {data.limitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <p>
            No fine-grid W* convergence was established. Pixel spacing is not independent terrain
            knowledge. Observer conventions are alternative analysis definitions.
          </p>
        </section>
        <p className="drawer-footer">
          B-01 · frozen scientific evidence · no live scientific calculation
        </p>
      </div>
    </dialog>
  );
}
