export function SiteHeader({
  active,
  context,
}: {
  active: 'audit' | 'navigator' | 'evidence';
  context?: string;
}) {
  return (
    <header className="site-header">
      <a href="/" className="site-brand" aria-label="RESOLVE home">
        <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
          <path
            d="M5 25V7h11c10 0 10 11 0 11H5m11 0 10 7"
            stroke="currentColor"
            fill="none"
            strokeWidth="2"
          />
        </svg>
        <span>RESOLVE</span>
      </a>
      {context && <span className="site-context">{context}</span>}
      <nav aria-label="Primary navigation">
        {(
          [
            ['audit', 'Audit', '/'],
            ['navigator', 'Navigator', '/navigator/'],
            ['evidence', 'Evidence', '/science/'],
          ] as const
        ).map(([key, label, href]) => (
          <a key={key} href={href} aria-current={active === key ? 'page' : undefined}>
            {label}
          </a>
        ))}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <a href="/" className="site-footer-brand">
          RESOLVE<span aria-hidden="true">↗</span>
        </a>
        <p>Modeled visibility. Explicit assumptions.</p>
      </div>
      <nav aria-label="Supporting links">
        <a href="/demo/">Guided demo</a>
        <a href="/science/#reproduce">Sources & reproduction</a>
      </nav>
      <p className="site-footer-note">
        NASA Space Apps 2026 project · geometric visibility research
      </p>
    </footer>
  );
}
