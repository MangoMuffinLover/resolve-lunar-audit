import frozen from '@/data/audit.v1.json';
import type { AuditData } from '@/lib/contract';
import { DecisionAudit } from '@/components/decision-audit';
import physical from '@/data/explain.v1.json';
import type { AuditPhysics } from '@/components/audit-mechanism';
export default function Page() {
  return (
    <DecisionAudit
      data={frozen as unknown as AuditData}
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
