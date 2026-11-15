import { projectMetadata } from '@/lib/identity';
import { Suspense } from 'react';
import manifest from '@/data/factors.v1.json';
import type { FactorManifest } from '@/lib/factor-contract';
import { FactorAudit } from '@/components/factor-audit';
export const metadata = projectMetadata('Project RESOLVE — Modeling Factor Audit', '/factors/');
export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="factor-main">
          <p role="status">Opening the modeling-factor audit…</p>
        </main>
      }
    >
      <FactorAudit manifest={manifest as unknown as FactorManifest} />
    </Suspense>
  );
}
