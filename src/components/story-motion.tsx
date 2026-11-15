'use client';
import { useEffect } from 'react';
export function StoryMotion({ revision }: { revision: string }) {
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) return;
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-story]'));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
      },
      { threshold: 0.08 },
    );
    for (const element of elements) {
      element.classList.add('story-armed');
      observer.observe(element);
    }
    const reveal = () => {
      if (media.matches) {
        elements.forEach((el) => el.classList.add('is-visible'));
        observer.disconnect();
      }
    };
    media.addEventListener('change', reveal);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', reveal);
      elements.forEach((el) => el.classList.remove('story-armed'));
    };
  }, [revision]);
  return null;
}
