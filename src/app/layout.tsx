import { projectIdentity, projectMetadata } from '@/lib/identity';
import type { Metadata } from 'next';
import './globals.css';
import './design.css';
import './cinema.css';
import './deliberate.css';
import './research.css';
import './brand.css';
export const metadata: Metadata = {
  ...projectMetadata('Project RESOLVE — Lunar Visibility Decision-Convergence Audit'),
  metadataBase: new URL(projectIdentity.url),
  applicationName: projectIdentity.brand,
  robots: { index: true, follow: true },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
