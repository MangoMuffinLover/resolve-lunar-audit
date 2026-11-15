import initial from '@/visuals/initial.json';
import visualManifest from '@/visuals/manifest.json';
import type { VisualAssets } from '@/lib/visual-contract';
import frozen from '@/data/audit.v1.json';
import type { AuditData } from '@/lib/contract';
import { DecisionAudit } from '@/components/decision-audit';
import physical from '@/data/explain.v1.json';
import type { AuditPhysics } from '@/components/audit-mechanism';
export default function Page() {
  return (
    <DecisionAudit
      data={frozen as unknown as AuditData}
      visual={{ ...visualManifest, initial } as unknown as VisualAssets}
      physics={
        {
          models: physical.models,
          domain: physical.domain,
          plot: physical.plot,
        } as unknown as AuditPhysics
      }
    />
  );
}
