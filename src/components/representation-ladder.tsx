import type { AuditData, Domain, Observer, Representation } from '@/lib/contract';
import { caseKey } from '@/lib/contract';
import { fixed } from '@/lib/format';

export function RepresentationLadder({
  data,
  observer,
  domain,
  selected,
  onSelect,
}: {
  data: AuditData;
  observer: Observer;
  domain: Domain;
  selected: string;
  onSelect: (id: string) => void;
}) {
  const row = (model: Representation) => {
    const result = data.cases[caseKey(model.id, observer, domain)];
    return (
      <button
        className={`model-row ${selected === model.id ? 'selected' : ''}`}
        type="button"
        aria-pressed={selected === model.id}
        key={model.id}
        onClick={() => onSelect(model.id)}
        data-testid={`model-${model.id}`}
      >
        <span className="model-label">
          <strong>{model.label}</strong>
          <small>
            {model.id === 'P78_5m'
              ? 'Reference representation'
              : model.type === 'separate-sdem'
                ? 'Separate SDEM branch'
                : model.type === 'synthetic-control'
                  ? '59.88 m · R-01B control'
                  : `NASA Product ${model.product.value}`}
          </small>
        </span>
        <span className="model-track" aria-hidden="true">
          <span
            className="model-line"
            style={{ width: `${(result.simultaneous.days.value / 15) * 100}%` }}
          />
          <span
            className={`model-point ${model.type === 'separate-sdem' ? 'square' : ''}`}
            style={{ left: `${(result.simultaneous.days.value / 15) * 100}%` }}
          />
        </span>
        <span className="model-value">
          {fixed(result.simultaneous.days.value)} <small>d</small>
          <span className="sr-only"> days. {selected === model.id ? 'Selected.' : ''}</span>
        </span>
      </button>
    );
  };
  return (
    <div className="ladder" role="group" aria-label="Select a precomputed terrain representation">
      <div className="ladder-axis" aria-hidden="true">
        <span>Window duration</span>
        <div>
          <span>0</span>
          <span>5</span>
          <span>10</span>
          <span>15 d</span>
        </div>
        <span />
      </div>
      <div className="native-models">
        {data.representations.filter((m) => m.type === 'native-lola').map(row)}
      </div>
      <div className="branch-label">
        <span />
        Another representation, also 5 m<span />
      </div>
      {data.representations.filter((m) => m.type === 'separate-sdem').map(row)}
      <p className="sdem-row-note">
        P104 is also a 5 m grid. Its represented ground height differs: the fixed observer is
        approximately 0.67 m above its surface, versus 2 m in the alternative convention.
      </p>
      <p className="chart-note">
        NASA LRO (Lunar Reconnaissance Orbiter) / LOLA (Lunar Orbiter Laser Altimeter) terrain
        products. Grid spacing, processing and alignment differ; spacing is not terrain accuracy and
        fine-grid convergence has not been established.
      </p>
      <details className="synthetic-detail">
        <summary>Synthetic control · expanded scientific detail</summary>
        <p>
          Area averaging is a research control. It is distinct from the native NASA 60 m product.
        </p>
        {data.representations.filter((m) => m.type === 'synthetic-control').map(row)}
      </details>
    </div>
  );
}
