"""Package matched R-01C mechanisms and precompute common-clock geometry.

No terrain or event solver is run. Frozen research is read-only; outputs are
versioned product records under web/. Geometry uses the existing DE421 chain.
"""
import sys
sys.dont_write_bytecode = True
import argparse
import csv
import hashlib
import json
import math
from datetime import datetime, timedelta, timezone
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--science-root', type=Path)
parser.add_argument('--web-root', type=Path)
args = parser.parse_args()
WEB = (args.web_root or Path(__file__).resolve().parents[1]).resolve()
ROOT = (args.science_root or WEB.parent).resolve()
sys.path.insert(0, str(ROOT))

import spiceypy as spice
from research.r01.geometry.spice import load_kernels, directions, FRAME, KERNELS
from research.r01b.fidelity import Geometry, Profile

START = datetime(2026, 11, 6, tzinfo=timezone.utc)
END = datetime(2026, 12, 1, tzinfo=timezone.utc)
STEP = 1800
OUT = WEB / 'public/evidence/explain'
OUT.mkdir(parents=True, exist_ok=True)
sources = {}


def digest(p):
    with p.open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()


def source(key, relative, parse=True):
    p = ROOT / relative
    sources[key] = dict(path=relative, sha256=digest(p), bytes=p.stat().st_size)
    if not parse:
        return None
    if p.suffix == '.json':
        return json.loads(p.read_text(encoding='utf-8'))
    if p.suffix == '.csv':
        with p.open(encoding='utf-8', newline='') as f:
            return [dict(row=i, **row) for i, row in enumerate(csv.DictReader(f), 2)]


def save(p, data):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, separators=(',', ':'), allow_nan=False) + '\n', encoding='utf-8')


def iso(d):
    return d.isoformat(timespec='milliseconds').replace('+00:00', 'Z')


def inside(et, intervals):
    return any(w['start_et_s'] <= et < w['end_et_s'] for w in intervals)


rows = source('response', 'results/r01c/resolution_response.csv')
witnesses = source('witnesses', 'results/r01c/horizon_witnesses.csv')
audit = source('b01-contract', 'web/src/data/audit.v1.json')
factors = source('b03-manifest', 'web/src/data/factors.v1.json')
source('mechanism', 'data/processed/r01c/mechanism.json', parse=False)
source('finding', 'results/r01c/R01C_FINDING.md')
radii = source('disc-assumptions', 'data/processed/r01b/disc_assumptions.json')['radii_km']
for name in KERNELS:
    source('kernel-' + name, 'data/raw/kernels/' + name)
    source('receipt-' + name, 'data/raw/kernels/' + name + '.retrieval.json')
for name in ['research/r01/geometry/spice.py', 'research/r01b/fidelity.py', 'research/r01/horizons/model.py']:
    source('code-' + Path(name).stem, name)
load_kernels(ROOT)
dates = [START + timedelta(seconds=i * STEP) for i in range(int((END-START).total_seconds()/STEP))]
ets = [float(spice.str2et(iso(d))) for d in dates]
model_files, sections, geometries, validation = {}, {}, {}, []
fields = {
    'time_utc': 'UTC', 'target_azimuth_deg': 'deg', 'target_elevation_deg': 'deg',
    'interpolated_horizon_deg': 'deg', 'clearance_deg': 'deg',
    'azimuth_deg': 'deg', 'horizon_elevation_deg': 'deg', 'surface_range_m': 'm',
    'witness_height_m': 'm above reference radius', 'source_product': 'product ID',
}


def csv_evidence(row, field, unit, source_id='response'):
    original = row[field]
    value = original if unit in ['UTC', 'product ID'] else float(original)
    return dict(value=value, original=original, unit=unit, source=dict(sourceId=source_id, row=row['row'], field=field))


def witness_group(model_id, observer, diagnostic):
    found = [w for w in witnesses if w['configuration'] == model_id and w['observer_convention'] == observer and w['diagnostic'] == diagnostic]
    assert len(found) == 2 and {w['bracketing_ray'] for w in found} == {'lower', 'upper'}
    lower = next(w for w in found if w['bracketing_ray'] == 'lower')
    before = math.floor((datetime.fromisoformat(lower['time_utc'].replace('Z', '+00:00'))-START).total_seconds()/STEP)
    assert 0 <= before < len(dates)-1
    return dict(target=lower['target'], diagnostic=diagnostic,
        at={k: csv_evidence(lower, k, fields[k], 'witnesses') for k in ['time_utc', 'target_azimuth_deg', 'target_elevation_deg', 'interpolated_horizon_deg', 'clearance_deg']},
        rays=[dict(bracket=w['bracketing_ray'], **{k:csv_evidence(w,k,fields[k],'witnesses') for k in ['azimuth_deg','horizon_elevation_deg','surface_range_m','witness_height_m','source_product']}) for w in sorted(found,key=lambda w:w['bracketing_ray'])],
        sample_before_index=before, sample_after_index=before+1)


for model_id in [m['id'] for m in factors['models']]:
    section_meta = audit['sectionFiles'][model_id]
    section_path = WEB/'public'/section_meta['url'].lstrip('/')
    section_data = json.loads(section_path.read_text(encoding='utf-8'))
    assert section_data['id'] == model_id and section_data['schema'] == 'resolve.sections.v1'
    # Exact section-to-research sample checks remain in the B-01 contract tests;
    # record and verify the product copy here without duplicating the 14 MB
    # mechanism object in this scientific Python process.
    sections[model_id] = dict(href=section_meta['url'], sha256=digest(section_path), bytes=section_path.stat().st_size)
    for observer in ['fixed_absolute','each_surface_2m']:
        key = f'{model_id}_{observer}'
        model = source('horizon-' + key, f'data/processed/r01c/{model_id}_refined_{observer}_horizon.json')
        solution = source('solution-' + key, f'data/processed/r01c/{model_id}_refined_{observer}_solution.json')
        assert solution['valid'] and all(c['passed'] for c in solution['temporal_validation'])
        envelope = solution['uncensored']['smallest_integer_day_envelope']
        assert envelope['start_utc'] <= iso(START) and envelope['end_utc'] >= iso(END)
        row = next(r for r in rows if r['configuration'] == model_id and r['observer_convention'] == observer and r['scope'] == 'uncensored_intersecting_registered')
        radial = model['geometry_observer_radius_m']
        geometry_key = (model['longitude_east_deg'], model['latitude_deg'], radial)
        if geometry_key not in geometries:
            geometries[geometry_key] = Geometry(geometry_key[0], geometry_key[1], radial, radii)
        geo = geometries[geometry_key]
        profile = Profile(model)
        snapshots, max_error = [], 0.0
        for i, et in enumerate(ets):
            positions = geo.at(et)
            sample = []
            for target in ['sun','earth']:
                az, el, _ = positions[target]
                clearance = profile.center_clearance(az,el)
                horizon = el-clearance
                visible = clearance > 0
                for v in [solution['uncensored']['visibility'],solution['final_75s_visibility']]:
                    assert visible == inside(et,v['intervals'][target]), f'{key} {i} {target}: mismatched source event state'
                sample += [az,el,horizon,clearance,visible]
            both = sample[4] and sample[9]
            for v in [solution['uncensored']['visibility'],solution['final_75s_visibility']]:
                assert both == inside(et,v['intervals']['simultaneous'])
            sample.append(both)
            if i in [0,1,len(ets)//2,len(ets)-1]:
                independent = directions(et,geometry_key[0],geometry_key[1],radial)
                for target,offset in [('sun',0),('earth',5)]:
                    for field,index in [('azimuth_deg',0),('elevation_deg',1)]:
                        error=abs(sample[offset+index]-independent[target+'_'+field]);max_error=max(max_error,error);assert error<1e-10
            snapshots.append(sample)
        record = dict(schema='resolve.explain.model.v1',key=key,model=model_id,observer=observer,label=row['label'],
            source_refs=dict(horizon='horizon-'+key,solution='solution-'+key),
            ground=csv_evidence(row,'ground_height_m','m above reference radius'),
            absolute=csv_evidence(row,'absolute_observer_height_m','m above reference radius'),
            above_ground=csv_evidence(row,'observer_above_ground_m','m'),
            skyline=[[r['azimuth_deg'],r['horizon_elevation_deg']] for r in model['witnesses']],
            snapshots=snapshots,
            solar_onset=witness_group(model_id,observer,'own_late_solar_onset'),
            simultaneous_end=witness_group(model_id,observer,'own_late_simultaneous_end'))
        output=OUT/f'{key}.v1.json';save(output,record)
        model_files[key]=dict(href=f'/evidence/explain/{output.name}',sha256=digest(output),bytes=output.stat().st_size,label=row['label'],model=model_id,observer=observer)
        validation.append(dict(key=key,snapshots=len(snapshots),event_checks=len(snapshots)*6,mismatches=0,independent_geometry_max_error_deg=max_error))
        del profile, model, solution, snapshots, record

pairs={}
for site in factors['sites']:
    p=WEB/'public'/site['href'].lstrip('/');assert digest(p)==site['sha256']
    source('factor-record-'+site['id'],'web/public'+site['href'])
    data=json.loads(p.read_text(encoding='utf-8'))
    for c in data['comparisons']:
        supported=site['id']=='dGR101' and c['factor'] in ['terrain','observer','domain','temporal']
        before=after=None
        if supported:
            if c['factor']=='terrain':
                before=f'P78_5m_{c["observer"]}';after=f'{c["variant"]}_{c["observer"]}'
            elif c['factor']=='observer':
                before=f'{c["variant"]}_fixed_absolute';after=f'{c["variant"]}_each_surface_2m'
            else:
                before=after=f'{c["variant"]}_{c["observer"]}'
            assert before in model_files and after in model_files
        pairs[site['id']+':'+c['id']]=dict(site=site['id'],comparison=c['id'],factor=c['factor'],supported=supported,before=before,after=after)

for info in sources.values():
    assert digest(ROOT/info['path'])==info['sha256'], 'A source changed during extraction'
manifest=dict(schema='resolve.explain.v1',
    domain=dict(start_utc=iso(START),end_utc=iso(END),sample_count=len(dates),step_s=STEP,default_utc='2026-11-22T15:00:00.000Z'),
    snapshot_fields=['sun_azimuth_deg','sun_elevation_deg','sun_horizon_deg','sun_clearance_deg','sun_visible','earth_azimuth_deg','earth_elevation_deg','earth_horizon_deg','earth_clearance_deg','earth_visible','simultaneous_visible'],
    geometry=dict(frame=FRAME,ephemeris='DE421',aberration='NONE',semantics='geometric centers'),
    factor_sites=factors['sites'],models=model_files,sections=sections,pairs=pairs,sources=sources,validation=validation,
    plot=dict(elevation=[-9,9],solar_sector=[40,170],full_sector=[0,360]),
    aligned_finding=audit['reportedComparisons'],
    limitations=[
        'Matched physical records are packaged only for R-01C dGR101 terrain, observer, domain and numerical comparisons. Other studies keep their own contextual explanation; no R-01C terrain mechanism is borrowed.',
        'The common-clock view uses stored 30-minute snapshots from Nov 6 through Nov 30, 2026 UTC. It does not interpolate celestial positions or resolve event times.',
        'Trajectory lines are visual joins of stored snapshots, not a continuous event solution. Refined interval endpoints remain separate source evidence.',
        'Own-onset and own-end witnesses belong to each model’s own event time and bracketing rays. They are separate from the currently selected common-clock snapshot.',
        'Surface sections copy saved terrain heights in two specific sectors. They do not turn a bracketing-ray witness into a point on a different section azimuth. No sightline or terrain profile is regenerated.',
        'The observer datum diagram uses source elevations on a shared vertical scale; horizontal separation is schematic.',
        'Geometric visibility is not generated power, a link budget, terrain truth or mission certification.',
    ],generator=dict(path='web/scripts/build-explanations.py',sha256=digest(Path(__file__))))
save(WEB/'src/data/explain.v1.json',manifest)
save(OUT/'manifest.v1.json',manifest)
save(WEB/'evidence/explanation-sources.json',manifest)
print(f'B-04: {len(model_files)} matched model/observer records; {sum(v["event_checks"] for v in validation)} snapshot/event checks agree; {sum(p["supported"] for p in pairs.values())} supported physical pairs, remaining study contexts explicitly separate. No terrain or interval solver rerun.')
