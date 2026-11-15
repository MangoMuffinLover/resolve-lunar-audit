export function ResearchJourney() {
  return (
    <section
      className="research-journey"
      aria-labelledby="journey-title"
      data-story
      data-testid="research-journey"
    >
      <div className="journey-heading">
        <p className="eyebrow">The research changed the question</p>
        <h2 id="journey-title">
          We followed the evidence.
          <br />
          <em>Even when it changed our direction.</em>
        </h2>
      </div>
      <ol>
        <li>
          <span className="journey-id">R-01A</span>
          <h3>
            The hypothesis
            <br />
            was not supported.
          </h3>
          <p>The limited terrain-uncertainty pilot did not support the original hypothesis.</p>
          <a href="/science/#control">Inspect the negative finding ↗</a>
        </li>
        <li>
          <span className="journey-id">R-01B</span>
          <h3>
            A different
            <br />
            sensitivity emerged.
          </h3>
          <p>Changing modeling assumptions exposed a different source of decision sensitivity.</p>
          <a href="/science/#findings">Follow the research progression ↗</a>
        </li>
        <li>
          <span className="journey-id">R-01C</span>
          <h3>
            The response survived
            <br />
            native-product checks.
          </h3>
          <p>
            Native NASA terrain products retained a large representation-sensitive effect under
            stated definitions.
          </p>
          <a href="/science/#validation">Inspect validation and limits ↗</a>
        </li>
      </ol>
      <p className="journey-footnote">
        A reproducible representation response. No terrain-truth ranking. No mission certification.
      </p>
    </section>
  );
}
