import frozen from '@/visuals/assumptions.json';
export function AssumptionComparisons() {
  return (
    <div className="scoped-assumptions">
      {frozen.map(({ comparison, before, after }) => (
        <article key={comparison.id}>
          <p className="eyebrow">
            {comparison.factor === 'temporal' ? 'Temporal sampling' : 'Visibility semantics'} /
            R-01B
          </p>
          <h3>
            {comparison.factor === 'temporal'
              ? 'The estimator matters.'
              : 'The observable matters.'}
          </h3>
          <p className="assumption-value">
            <span aria-label={`${before.days} days`}>{before.days.toFixed(2)}</span> <span>→</span>{' '}
            <span aria-label={`${after.days} days`}>{after.days.toFixed(2)}</span>{' '}
            <small>days</small>
          </p>
          <p>
            {comparison.beforeLabel} → {comparison.afterLabel}.
          </p>
          <p className="scope-caption">
            dGR203 · reporting-clipped 6–28 November 2026. {comparison.kind}. These are separate
            study contexts from the dGR101 terrain comparison.
          </p>
          <a
            href={`/factors/?site=dGR203&factor=${comparison.factor}&metric=simultaneous&comparison=${comparison.id}`}
          >
            Inspect the scoped comparison ↗
          </a>
        </article>
      ))}
    </div>
  );
}
export function NegativeFinding() {
  return (
    <section
      className="negative-finding"
      aria-labelledby="negative-title"
      data-story
      data-testid="negative-finding"
    >
      <div>
        <p className="eyebrow">The negative finding / dGR203</p>
        <h2 id="negative-title">
          Not every result
          <br />
          <em>behaves this way.</em>
        </h2>
        <p>
          In the separate seasonal pilot, all five tested local terrain clones retained the
          historical 6.5-day simultaneous classification. That limited negative finding changed the
          research direction.
        </p>
        <a href="/science/#control">Open the negative evidence ↗</a>
      </div>
      <div className="negative-number">
        <strong>
          5<span>/</span>5
        </strong>
        <span>TESTED LOCAL CLONES</span>
        <p>
          Same evaluated classification.
          <br />
          No claim of universal stability or calibrated probability.
        </p>
      </div>
    </section>
  );
}
