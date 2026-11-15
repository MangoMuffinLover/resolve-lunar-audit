export const projectIdentity = {
  name: 'Robustness Evaluation of South-Polar Observation and Lunar Visibility Estimates',
  formal:
    'Robustness Evaluation of South-Polar Observation and Lunar Visibility Estimates (RESOLVE)',
  brand: 'PROJECT RESOLVE',
  descriptor: 'Lunar Visibility Decision-Convergence Audit',
  tagline: 'Before you trust the window, audit the model.',
  description:
    'Robustness Evaluation of South-Polar Observation and Lunar Visibility Estimates (RESOLVE) audits whether modeled lunar Sun/Earth visibility predictions remain stable across defensible modeling choices.',
  url: 'https://resolve-lunar-audit.vercel.app',
} as const;

export function projectMetadata(title: string, path = '/') {
  return {
    title,
    description: projectIdentity.description,
    openGraph: {
      title,
      description: projectIdentity.description,
      siteName: projectIdentity.brand,
      url: `${projectIdentity.url}${path}`,
      type: 'website' as const,
    },
    twitter: { card: 'summary' as const, title, description: projectIdentity.description },
  };
}
