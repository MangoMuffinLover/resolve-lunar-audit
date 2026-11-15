import frozen from '@/data/navigator.v1.json';
import type { NavigatorManifest } from '@/lib/navigator-contract';
import { Navigator } from '@/components/navigator';
export const metadata = {
  title: 'RESOLVE — Site & Date Navigator',
  description:
    'Compare three supported lunar sites and November 2026 dates using frozen terrain horizons and precomputed Sun/Earth geometry.',
};
export default function Page() {
  return <Navigator manifest={frozen as unknown as NavigatorManifest} />;
}
