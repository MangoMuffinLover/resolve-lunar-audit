"""Precompute bounded B-02 snapshots from verified kernels and frozen horizons.

Writes only product artifacts beneath web/. Does not run a terrain or interval
solver and never overwrites R-01A/B/C. The browser selects stored snapshots.
"""
import sys
sys.dont_write_bytecode = True
import argparse
import hashlib
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--science-root', type=Path)
parser.add_argument('--web-root', type=Path)
args = parser.parse_args()
WEB = (args.web_root or Path(__file__).resolve().parents[1]).resolve()
ROOT = (args.science_root or WEB.parent).resolve()
sys.path.insert(0, str(ROOT))

import numpy as np
import spiceypy as spice
from research.r01.geometry.spice import load_kernels, directions, FRAME, KERNELS
from research.r01.horizons.model import RADIUS_M
from research.r01b.fidelity import Geometry, Profile

START = datetime(2026, 11, 6, tzinfo=timezone.utc)
END = datetime(2026, 11, 28, tzinfo=timezone.utc)
STEP = 1800
PUBLIC = WEB / 'public/evidence/navigator'
PUBLIC.mkdir(parents=True, exist_ok=True)
(WEB / 'src/data').mkdir(parents=True, exist_ok=True)
(WEB / 'evidence').mkdir(parents=True, exist_ok=True)
sources = {}


def digest(p):
    with p.open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()


def source(key, relative):
    p = ROOT / relative
    sources[key] = dict(path=relative, sha256=digest(p), bytes=p.stat().st_size)
    return json.loads(p.read_text(encoding='utf-8')) if p.suffix == '.json' else None


def save(p, d):
    p.write_text(json.dumps(d, separators=(',', ':'), allow_nan=False) + '\n', encoding='utf-8')


def iso(d):
    return d.isoformat(timespec='milliseconds').replace('+00:00', 'Z')


def inside(et, windows):
    return any(w['start_et_s'] <= et < w['end_et_s'] for w in windows)


selection = source('selection', 'data/processed/r01b/multisite_selection.json')
validation = source('screen-validation', 'data/processed/r01b/multisite_validation.json')
assert validation['passed'], 'The saved multisite validation gate did not pass'
radii = source('disc-assumptions', 'data/processed/r01b/disc_assumptions.json')['radii_km']
for p in ['research/r01/geometry/spice.py', 'research/r01b/fidelity.py', 'research/r01/horizons/model.py']:
    source('code-' + Path(p).stem, p)
for name in KERNELS:
    source('kernel-' + name, 'data/raw/kernels/' + name)
    source('receipt-' + name, 'data/raw/kernels/' + name + '.retrieval.json')
load_kernels(ROOT)
dates = [START + timedelta(seconds=i * STEP) for i in range(int((END - START).total_seconds() / STEP))]
ets = [float(spice.str2et(iso(d))) for d in dates]
sites = []
checks = []

for site_id in ['dGR101', 'dGR201', 'dGR204']:
    selected = next(r for r in selection['selected'] if r['site'] == site_id)
    if site_id == 'dGR101':
        horizon_path = 'data/processed/r01c/P78_5m_refined_fixed_absolute_horizon.json'
        visibility_path = 'data/processed/r01c/P78_5m_refined_fixed_absolute_solution.json'
        visibility_pointer = '/registered'
        level = 'R-01C refined model; temporal and horizon sensitivity checks. Full terrain-representation audit available.'
    else:
        horizon_path = f'data/processed/r01b/{site_id}_nominal_horizon.json'
        visibility_path = f'data/processed/r01b/{site_id}_center_5m_150s.json'
        visibility_pointer = ''
        level = 'R-01B nominal site screen; 300/150-second temporal check. No R-01C native-product audit at this site.'
    model = source(site_id + '-horizon', horizon_path)
    raw = source(site_id + '-visibility', visibility_path)
    v = raw['registered'] if visibility_pointer else raw
    assert v['semantics'] == 'center' and v['estimator'] == 'events'
    assert model['longitude_east_deg'] == selected['longitude_east_deg']
    assert model['latitude_deg'] == selected['latitude_deg']
    radial = model.get('geometry_observer_radius_m', RADIUS_M + model['observer_terrain_height_m'] + model['observer_height_m'])
    assert abs(radial - RADIUS_M - model['observer_terrain_height_m'] - 2) < 1e-8
    profile = Profile(model)
    geometry = Geometry(model['longitude_east_deg'], model['latitude_deg'], radial, radii)
    samples = []
    max_error = 0
    for index, (date, et) in enumerate(zip(dates, ets)):
        row = dict(utc=iso(date), et_tdb_s=et)
        positions = geometry.at(et)
        for target in ['sun', 'earth']:
            az, el, _ = positions[target]
            clearance = profile.center_clearance(az, el)
            sky = float(np.interp(az, profile.az, profile.el, period=360))
            visible = clearance > 0
            assert visible == inside(et, v['intervals'][target]), f'{site_id} {date} {target}: sampled clearance disagrees with frozen events'
            row[target] = dict(azimuth_deg=az, elevation_deg=el, horizon_deg=sky, clearance_deg=clearance, visible=visible)
        row['simultaneous_visible'] = row['sun']['visible'] and row['earth']['visible']
        assert row['simultaneous_visible'] == inside(et, v['intervals']['simultaneous'])
        current = next((i for i, w in enumerate(v['intervals']['simultaneous']) if w['start_et_s'] <= et < w['end_et_s']), None)
        future = next((i for i, w in enumerate(v['intervals']['simultaneous']) if w['start_et_s'] > et), None)
        row['overlap'] = dict(kind='current' if current is not None else 'next' if future is not None else 'none',
            interval_index=current if current is not None else future,
            remaining_s=v['intervals']['simultaneous'][current]['end_et_s']-et if current is not None else None)
        # Cross-check selected boundary and interior samples through the original
        # independent direction entry point; both use the documented DE421 chain.
        if index in [0, 1, len(dates)//2, len(dates)-1]:
            independent = directions(et, model['longitude_east_deg'], model['latitude_deg'], radial)
            for target in ['sun', 'earth']:
                for field in ['azimuth_deg', 'elevation_deg']:
                    error = abs(row[target][field] - independent[target + '_' + field])
                    max_error = max(max_error, error)
                    assert error < 1e-10
        samples.append(row)
    metadata = dict(
        id=site_id, region='de Gerlache', latitude_deg=model['latitude_deg'],
        longitude_east_deg=model['longitude_east_deg'], ground_height_m=model['observer_terrain_height_m'],
        absolute_observer_height_m=radial-RADIUS_M, observer_height_m=2,
        local_product='NASA PGDA Product 78 SL2, 5 m grid',
        exterior_products='NASA PGDA Product 90, 80/240 m exterior terrain',
        azimuth_step_deg=model['azimuth_step_deg'], radial_factor=model['radial_factor'],
        max_distance_m=model['max_distance_m'], validation=level,
        horizon_source=site_id+'-horizon', visibility_source=site_id+'-visibility',
        visibility_pointer=visibility_pointer,
        href=f'/evidence/navigator/{site_id}.v1.json',
    )
    record = dict(schema='resolve.navigator.site.v1', site=metadata,
        source_refs=dict(skyline=f'{site_id}-horizon#/witnesses', intervals=f'{site_id}-visibility#{visibility_pointer}/intervals'),
        skyline=[[r['azimuth_deg'], r['horizon_elevation_deg']] for r in model['witnesses']],
        intervals=v['intervals'], longest=v['longest'], event_sampling_step_s=v['sampling_step_s'],
        samples=samples)
    output = PUBLIC / f'{site_id}.v1.json'
    save(output, record)
    metadata['sha256'] = digest(output)
    metadata['bytes'] = output.stat().st_size
    sites.append(metadata)
    checks.append(dict(site=site_id, samples=len(samples), frozen_interval_checks=len(samples)*3,
        clearance_event_mismatches=0, independent_geometry_max_error_deg=max_error))

# Source hashes are checked again before publishing the product manifest.
for info in sources.values():
    assert digest(ROOT / info['path']) == info['sha256'], 'A scientific source changed during extraction'
manifest = dict(schema='resolve.navigator.v1',
    challenge_url='https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/',
    domain=dict(start_utc=iso(START), end_utc=iso(END), snapshot_step_s=STEP, sample_count=len(dates),
        default_utc='2026-11-22T15:00:00.000Z', default_site='dGR101'),
    geometry=dict(frame=FRAME, ephemeris='DE421', aberration='NONE', semantics='geometric centers',
        reference_radius_m=RADIUS_M, observer='2 m above each site’s nominal Product 78 represented surface'),
    limitations=[
        'Three coverage-limited research sites, not a global site search or a site recommendation.',
        'Snapshots are precomputed at exact 30-minute UTC steps. The browser does not interpolate celestial geometry.',
        'Timelines copy frozen event-refined intervals. Snapshot spacing is not event-time precision.',
        'Remaining overlap is precomputed by subtracting the snapshot ET from its frozen simultaneous-interval endpoint; clipped endpoints remain clipped.',
        'Durations are clipped to Nov 6–28, 2026 UTC. Censored endpoints are not physical rise/set events.',
        'Sun visibility indicates geometric illumination opportunity, not generated power. Earth visibility is not a link budget or guaranteed communication.',
        'The local 5 m grid uses unchanged 80/240 m exterior terrain to 250 km. Grid spacing does not certify accuracy.',
        'The multisite cohort has unequal refinement and validation depth. Detailed representation auditing is available only at dGR101.',
    ], sites=sites, sources=sources, verification=checks,
    generator=dict(path='web/scripts/build-navigator.py', sha256=digest(Path(__file__))))
save(WEB/'src/data/navigator.v1.json', manifest)
save(PUBLIC/'manifest.v1.json', manifest)
save(WEB/'evidence/navigator-sources.json', manifest)
print(f'B-02: {len(sites)} sites × {len(dates)} stored UTC snapshots; all {sum(c["frozen_interval_checks"] for c in checks)} clearance/event checks match. Frozen horizons and intervals copied; no terrain or interval solver rerun.')
