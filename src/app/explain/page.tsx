import { Suspense } from 'react';
import manifest from '@/data/explain.v1.json';
import type { ExplainManifest } from '@/lib/explanation-contract';
import { ExplanationExplorer } from '@/components/explanation-explorer';
export const metadata = {
  title: 'RESOLVE — Physical Explanation',
  description:
    'Trace matched lunar terrain and observer comparisons to common-clock Sun/Earth geometry, frozen skylines, event witnesses and reporting boundaries.',
};
export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="explain-main">
          <p role="status">Opening the physical explanation…</p>
        </main>
      }
    >
      <ExplanationExplorer manifest={manifest as unknown as ExplainManifest} />
    </Suspense>
  );
}
