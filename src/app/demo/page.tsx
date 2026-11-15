import audit from '@/data/audit.v1.json';
import explanation from '@/data/explain.v1.json';
import science from '@/data/science.v1.json';
import navigator from '@/data/navigator.v1.json';
import type { AuditData } from '@/lib/contract';
import type { ExplainManifest } from '@/lib/explanation-contract';
import type { ScienceData } from '@/lib/science-contract';
import type { NavigatorManifest } from '@/lib/navigator-contract';
import { createDemoData } from '@/lib/demo-contract';
import { GuidedDemo } from '@/components/guided-demo';

export const metadata = {
  title: 'RESOLVE — Guided Demonstration',
  description:
    'Follow a modeled lunar visibility result through a terrain audit, physical horizon explanation, controls, negative evidence and source review.',
};
export default function Page() {
  const data = createDemoData(
    audit as unknown as AuditData,
    explanation as unknown as ExplainManifest,
    science as unknown as ScienceData,
    navigator as unknown as NavigatorManifest,
  );
  return <GuidedDemo data={data} />;
}
