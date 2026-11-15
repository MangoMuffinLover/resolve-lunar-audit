import { projectMetadata } from '@/lib/identity';
import frozen from '@/data/navigator.v1.json';
import type { NavigatorManifest } from '@/lib/navigator-contract';
import { Navigator } from '@/components/navigator';
export const metadata = projectMetadata('Project RESOLVE — Site and Date Navigator', '/navigator/');
export default function Page() {
  return <Navigator manifest={frozen as unknown as NavigatorManifest} />;
}
