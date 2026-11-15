'use client';
import { useEffect } from 'react';
const sections = [
  ['findings', 'Findings'],
  ['control', 'Negative evidence'],
  ['method', 'Method'],
  ['validation', 'Validation'],
  ['provenance', 'NASA data'],
  ['limits', 'Limits'],
  ['reproduce', 'Reproduce'],
] as const;
function reveal(id: string) {
  const element = document.getElementById(id);
  if (element instanceof HTMLDetailsElement) element.open = true;
  requestAnimationFrame(() => element?.scrollIntoView({ block: 'start' }));
}
export function EvidenceIndex() {
  useEffect(() => {
    const openHash = () => {
      const id = location.hash.slice(1);
      if (sections.some(([key]) => key === id)) reveal(id);
    };
    openHash();
    window.addEventListener('hashchange', openHash);
    return () => window.removeEventListener('hashchange', openHash);
  }, []);
  return (
    <nav className="science-index" aria-label="Science sections">
      {sections.map(([id, label]) => (
        <a key={id} href={`#${id}`} onClick={() => reveal(id)}>
          {label}
        </a>
      ))}
    </nav>
  );
}
