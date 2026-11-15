import type { Metadata } from 'next';
import './globals.css';
import './design.css';
import './cinema.css';
import './deliberate.css';
import './research.css';
export const metadata: Metadata = {
  title: 'RESOLVE — Lunar Landing Decision Audit',
  description:
    'Audit a predicted lunar visibility window across evaluated NASA terrain representations. Frozen R-01C evidence for dGR101.',
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
