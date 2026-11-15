import type { AuditCase } from '@/lib/contract';
import { position, utc } from '@/lib/format';

export function Timeline({ result, compact = false }: { result: AuditCase; compact?: boolean }) {
  const items = [
    { label: 'Sun', interval: result.timeline.sun },
    { label: 'Earth', interval: result.timeline.earth },
    { label: 'Together', interval: result.simultaneous },
  ];
  const min = Math.min(...items.map((i) => Date.parse(i.interval.start.value)));
  const max = Math.max(...items.map((i) => Date.parse(i.interval.end.value)));
  return (
    <figure
      className={`timeline ${compact ? 'compact' : ''}`}
      aria-label="Stored visibility intervals in UTC"
    >
      <div className="timeline-intro">
        <span className="eyebrow">The modeled overlap</span>
        <span className="mono">UTC · 2026</span>
      </div>
      <div className="timeline-body">
        {items.map(({ label, interval }, i) => (
          <div className={`timeline-row row-${i}`} key={label}>
            <span className="timeline-label">{label}</span>
            <div className="timeline-track">
              <span
                className="timeline-bar"
                style={{
                  left: `${position(Date.parse(interval.start.value), min, max) * 100}%`,
                  width: `${((Date.parse(interval.end.value) - Date.parse(interval.start.value)) / (max - min)) * 100}%`,
                }}
              >
                {interval.rightCensored.value && (
                  <span className="clip-mark" aria-label="Right censored">
                    ‖
                  </span>
                )}
              </span>
            </div>
            <span className="sr-only">
              {interval.start.value} to {interval.end.value}
              {interval.rightCensored.value ? ', clipped at the registered end' : ''}.
            </span>
          </div>
        ))}
        <div className="timeline-axis">
          <span>{utc(new Date(min).toISOString())}</span>
          <span>{utc(new Date(max).toISOString())}</span>
        </div>
      </div>
      <figcaption>
        <span>
          {utc(result.simultaneous.start.value, true)} <span aria-hidden="true">→</span>{' '}
          {utc(result.simultaneous.end.value, true)} UTC
        </span>
        <small>
          {result.simultaneous.rightCensored.value
            ? 'Right-censored at Nov 28. The episode continues outside this domain.'
            : 'Complete modeled episode, including time beyond the Nov 6–28 screening domain.'}
        </small>
      </figcaption>
    </figure>
  );
}
