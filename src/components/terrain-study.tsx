'use client';
import { useEffect, useRef, useState } from 'react';
import { verifiedJSON } from '@/lib/verified-json';
import type { TerrainMesh, TerrainView } from '@/lib/terrain-renderer';
import manifest from '@/visuals/terrain.json';

export function TerrainStudy() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const siteLabel = useRef<HTMLSpanElement>(null);
  const viewer = useRef<Awaited<
    ReturnType<typeof import('@/lib/terrain-renderer').mountTerrain>
  > | null>(null);
  const [opened, setOpened] = useState(false),
    [ready, setReady] = useState(false),
    [error, setError] = useState(false);
  const [view, setView] = useState<TerrainView>('oblique'),
    [moving, setMoving] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!opened || !canvas.current) return;
    const abort = new AbortController();
    const node = canvas.current;
    const lost = (event: Event) => {
      event.preventDefault();
      setError(true);
      setReady(false);
      setMoving(false);
    };
    node.addEventListener('webglcontextlost', lost);
    let active = true;
    setError(false);
    setReady(false);
    Promise.all([
      import('@/lib/terrain-renderer'),
      verifiedJSON<TerrainMesh>(manifest, 'resolve.terrain-study.v1'),
    ])
      .then(async ([module, mesh]) => {
        if (!active || !canvas.current) return;
        const instance = await module.mountTerrain(canvas.current, mesh, abort.signal, (x, y) => {
          if (siteLabel.current) {
            siteLabel.current.style.left = `${x}%`;
            siteLabel.current.style.top = `${y}%`;
          }
        });
        if (!active) {
          instance.destroy();
          return;
        }
        viewer.current = instance;
        setReady(true);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
      abort.abort();
      node.removeEventListener('webglcontextlost', lost);
      viewer.current?.destroy();
      viewer.current = null;
    };
  }, [opened, retry]);
  function choose(next: TerrainView) {
    setView(next);
    setMoving(true);
    viewer.current?.move(next, () => setMoving(false));
  }
  return (
    <section
      className="terrain-study"
      data-testid="terrain-study"
      aria-labelledby="terrain-study-title"
    >
      <div className="terrain-study-heading">
        <div>
          <p className="eyebrow">Terrain atlas / dGR101</p>
          <h3 id="terrain-study-title">Read the landscape.</h3>
        </div>
        <p>
          A 12.8 km terrain patch from NASA LOLA. Follow the site marker, then read the ridges and
          depressions around it.
        </p>
      </div>
      <div className="terrain-atlas-layout">
        <div className="terrain-viewport" data-state={moving ? 'moving' : 'settled'}>
          {/* A Blender render is the accessible fallback when WebGL is unavailable. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/visuals/terrain/dgr101-native80.webp"
            width="1600"
            height="1000"
            loading="lazy"
            alt="Blender rendering of the native NASA terrain patch near dGR101, with no vertical exaggeration"
            aria-hidden={ready && !error}
            className={ready && !error ? 'terrain-poster is-hidden' : 'terrain-poster'}
          />
          {opened && (
            <canvas
              key={retry}
              ref={canvas}
              className={ready && !error ? 'terrain-webgl is-ready' : 'terrain-webgl'}
              role="img"
              aria-label="Interactive 3D view of NASA Product 90 terrain around dGR101; illustrative lighting, true vertical scale"
              aria-hidden={!ready || error}
            />
          )}
          <span
            ref={siteLabel}
            className="terrain-site-label"
            hidden={!ready || error}
            aria-hidden="true"
          >
            dGR101
          </span>
        </div>
        <aside className="terrain-reading-key" aria-label="How to read the terrain">
          <span className="eyebrow">Reading this view</span>
          <h4>A landscape with a known scale.</h4>
          <dl>
            <div>
              <dt>
                <i className="key-site" /> Site marker
              </dt>
              <dd>
                dGR101 · 88.513° S<br />
                68.015° W
              </dd>
            </div>
            <div>
              <dt>
                <i className="key-contour" /> Elevation contours
              </dt>
              <dd>250 m radial-height intervals, traced on the displayed mesh.</dd>
            </div>
            <div>
              <dt>
                <i className="key-boundary" /> Cut boundary
              </dt>
              <dd>The sample patch ends here. Its vertical edges are display closures.</dd>
            </div>
          </dl>
          <p className="terrain-reading-note">
            This 80 m grid gives regional context. Use the 5 m / 80 m cross-section above to inspect
            the nearby 49 m feature.
          </p>
        </aside>
      </div>
      <div className="terrain-control-row">
        <span className="terrain-scale">NASA PRODUCT 90 · 80 m SAMPLES · 1× HEIGHT SCALE</span>
        <button
          className="terrain-open"
          aria-pressed={opened}
          onClick={() => {
            setOpened((value) => !value);
            setReady(false);
            setMoving(false);
            setView('oblique');
          }}
        >
          {opened ? 'Use still render' : 'Explore the terrain in 3D'}{' '}
          <span aria-hidden="true">↗</span>
        </button>
        {ready && !error && (
          <div className="terrain-view-controls" role="group" aria-label="3D camera views">
            {(
              [
                ['oblique', 'Oblique view'],
                ['rim', 'Look across the rim'],
                ['overhead', 'Top view'],
              ] as const
            ).map(([id, label]) => (
              <button key={id} aria-pressed={view === id} onClick={() => choose(id)}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="terrain-status" role="status">
        {error ? (
          <>
            Interactive 3D is unavailable. The verified Blender render remains visible.{' '}
            <button
              onClick={() => {
                setView('oblique');
                setRetry((n) => n + 1);
              }}
            >
              Retry 3D
            </button>
          </>
        ) : opened && !ready ? (
          'Verifying the terrain mesh…'
        ) : moving ? (
          'Moving the camera slowly. This view will hold when it arrives.'
        ) : ready ? (
          'Choose a camera view. The terrain stays still until you tap again.'
        ) : (
          'Tap to enter. No automatic orbit or camera movement.'
        )}
      </p>
      <p className="terrain-provenance">
        12.8 km across in the native map plane · true vertical scale · 250 m contour interval.
        Camera and lighting are illustrative, not the modeled Sun. The gold marker identifies the
        site, not the scientific observer height. This terrain view gives spatial context; the
        frozen horizon evidence above supplies the audit.{' '}
        <a href="/visuals/terrain/provenance.json">Inspect mesh provenance ↗</a>
      </p>
    </section>
  );
}
