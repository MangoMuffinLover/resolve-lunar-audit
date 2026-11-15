import { createReadStream } from 'node:fs';
import { readFile, writeFile, mkdir, copyFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const scienceRoot = path.resolve(webRoot, '..');
export const key = (id, observer, domain) => `${id}:${observer}:${domain}`;
const readJSON = async (p) => JSON.parse(await readFile(path.join(scienceRoot, p), 'utf8'));
export async function digest(p) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(p)) hash.update(chunk);
  return hash.digest('hex');
}

// RFC 4180 records, including escaped quotes and quoted newlines. Row 1 is the header.
export function parseCSV(text) {
  const records = [];
  let record = [],
    field = '',
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && (c === ',' || c === '\n' || c === '\r')) {
      record.push(field);
      field = '';
      if (c !== ',') {
        records.push(record);
        record = [];
        if (c === '\r' && text[i + 1] === '\n') i++;
      }
    } else field += c;
  }
  if (quoted) throw new Error('Unclosed CSV quote');
  if (field || record.length) {
    record.push(field);
    records.push(record);
  }
  const header = records.shift();
  return records
    .filter((r) => r.some(Boolean))
    .map((r, i) => {
      if (r.length !== header.length) throw new Error(`CSV record ${i + 2} has wrong field count`);
      return { row: i + 2, ...Object.fromEntries(header.map((h, j) => [h, r[j]])) };
    });
}

async function scienceFreeze({ allowCreateBaseline = true } = {}) {
  const manifestPath = 'data/processed/r01c/r01c_manifest.json';
  const manifest = await readJSON(manifestPath);
  const frozen = await readJSON(manifest.frozen_r01ab.path);
  const inventory = new Map();
  const walk = (value) => {
    if (!value || typeof value !== 'object') return;
    if (typeof value.path === 'string' && /^[a-f0-9]{64}$/.test(value.sha256 || '')) {
      const previous = inventory.get(value.path);
      if (previous && previous.sha256 !== value.sha256)
        throw new Error(`Conflicting frozen hashes: ${value.path}`);
      inventory.set(value.path, { path: value.path, sha256: value.sha256 });
    }
    for (const v of Object.values(value)) walk(v);
  };
  walk(manifest);
  walk(frozen);
  inventory.set(manifestPath, {
    path: manifestPath,
    sha256: await digest(path.join(scienceRoot, manifestPath)),
  });
  const files = [...inventory.values()].sort((a, b) => a.path.localeCompare(b.path));
  for (const entry of files) {
    if (!path.resolve(scienceRoot, entry.path).startsWith(scienceRoot + path.sep))
      throw new Error('Invalid frozen path');
    const actual = await digest(path.join(scienceRoot, entry.path));
    if (actual !== entry.sha256) throw new Error(`Frozen science changed: ${entry.path}`);
  }
  const snapshot = {
    schema: 'resolve.science-freeze.v1',
    r01abFiles: frozen.files.length,
    r01cArtifacts: manifest.artifacts.length,
    files,
  };
  const target = path.join(webRoot, 'evidence/science-freeze.json');
  let baseline;
  try {
    baseline = JSON.parse(await readFile(target, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (baseline && JSON.stringify(baseline) !== JSON.stringify(snapshot))
    throw new Error('Science snapshot differs from the B-01 baseline');
  if (!baseline) {
    if (!allowCreateBaseline)
      throw new Error(
        'B-01 freeze baseline is missing; verification does not create a new baseline.',
      );
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, JSON.stringify(snapshot, null, 2) + '\n');
  }
  console.log(
    `Verified ${files.length} frozen files; ${frozen.files.length} R-01A/B files and ${manifest.artifacts.length} R-01C artifacts covered.`,
  );
  return manifest;
}

export async function extract({ verifyOnly = false } = {}) {
  const manifest = await scienceFreeze({ allowCreateBaseline: !verifyOnly });
  if (verifyOnly) return;
  const sources = {};
  async function source(id, p, publicCopy = false) {
    const full = path.join(scienceRoot, p);
    sources[id] = {
      path: p,
      sha256: await digest(full),
      bytes: (await stat(full)).size,
      experiment: p.includes('r01c') ? 'R-01C' : p.includes('R01B') ? 'R-01B' : 'R-01A',
    };
    if (publicCopy) {
      sources[id].href = `/evidence/frozen/${path.basename(p)}`;
      const target = path.join(webRoot, 'public', sources[id].href);
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(full, target);
    }
  }
  const paths = {
    response: 'results/r01c/resolution_response.csv',
    pairwise: 'results/r01c/pairwise_changes.csv',
    intervals: 'results/r01c/all_relevant_intervals.csv',
    inventory: 'results/r01c/raster_inventory.csv',
    witnesses: 'results/r01c/horizon_witnesses.csv',
    support: 'results/r01c/witness_data_support.csv',
    summary: 'data/processed/r01c/r01c_summary.json',
    manifest: 'data/processed/r01c/r01c_manifest.json',
    ladder: 'data/processed/r01c/ladder_final.json',
    numerical: 'data/processed/r01c/numerical_audit.json',
    verification: 'data/processed/r01c/final_verification.json',
    mechanism: 'data/processed/r01c/mechanism.json',
    finding: 'results/r01c/R01C_FINDING.md',
    report: 'results/r01c/R01C_FINAL_REPORT.md',
    gate: 'results/r01c/STRATEGY_GATE.md',
    historyA: 'results/R01_FINDING.md',
    historyB: 'results/R01B_FINAL_REPORT.md',
    horizonFigure: 'results/r01c/figures/critical_horizon_profiles.png',
    terrainFigure: 'results/r01c/figures/terrain_cross_section.png',
    responseFigure: 'results/r01c/figures/resolution_response_curve.png',
  };
  for (const [id, p] of Object.entries(paths))
    await source(
      id,
      p,
      [
        'response',
        'pairwise',
        'intervals',
        'finding',
        'historyA',
        'horizonFigure',
        'terrainFigure',
        'responseFigure',
      ].includes(id),
    );
  const tables = {};
  for (const id of ['response', 'pairwise', 'intervals', 'inventory', 'witnesses', 'support'])
    tables[id] = parseCSV(await readFile(path.join(scienceRoot, paths[id]), 'utf8'));
  const ladder = await readJSON(paths.ladder),
    mechanism = await readJSON(paths.mechanism);
  const ref = (sourceId, field, row, pointer) => ({
    sourceId,
    field,
    ...(row ? { row } : {}),
    ...(pointer ? { pointer } : {}),
  });
  const csvDatum = (id, row, field, unit, type = 'number') => {
    const original = row[field];
    const value =
      type === 'number' ? Number(original) : type === 'boolean' ? original === 'True' : original;
    if (type === 'number' && (!original || !Number.isFinite(value)))
      throw new Error(`Invalid number: ${id}:${row.row}:${field}`);
    if (type === 'boolean' && !['True', 'False'].includes(original))
      throw new Error('Invalid boolean');
    return { value, original, unit, source: ref(id, field, row.row) };
  };
  const jsonDatum = (id, value, unit, pointer) => ({
    value,
    original: JSON.stringify(value),
    unit,
    source: ref(id, pointer.split('/').at(-1), undefined, pointer),
  });
  const rows = tables.response;
  const modelIds = [...new Set(rows.map((r) => r.configuration))];
  const representations = modelIds.map((id) => {
    const row = rows.find((r) => r.configuration === id);
    const solution = ladder.solutions[`${id}_fixed_absolute`];
    const config = solution.configuration;
    const inv = tables.inventory.find((r) => r.path === config.path);
    return {
      id,
      label: id.startsWith('SYNTHETIC') ? 'Synthetic area-averaged control' : row.label,
      type: id.startsWith('SYNTHETIC')
        ? 'synthetic-control'
        : id.startsWith('P104')
          ? 'separate-sdem'
          : 'native-lola',
      product: csvDatum('response', row, 'nasa_product', 'product id', 'string'),
      spacing: csvDatum('response', row, 'pixel_spacing_m', 'm'),
      sourceRaster: config.path,
      rasterSha256: inv?.sha256 || null,
      description: id.startsWith('P104')
        ? 'Separate SDEM processing branch; also 5 m pixel spacing.'
        : id.startsWith('SYNTHETIC')
          ? 'R-01B area averaging of the nominal surface. Not a native NASA 60 m grid.'
          : row.native_or_control,
      nasaUrl: id.startsWith('SYNTHETIC')
        ? null
        : `https://pgda.gsfc.nasa.gov/products/${row.nasa_product}`,
      source: ref(
        'ladder',
        'configuration',
        undefined,
        `/solutions/${id}_fixed_absolute/configuration`,
      ),
    };
  });
  const cases = {};
  const metric = (r, name) => ({
    days: csvDatum('response', r, `${name}_days`, 'd'),
    start: csvDatum('response', r, `${name}_start_utc`, 'UTC', 'string'),
    end: csvDatum('response', r, `${name}_end_utc`, 'UTC', 'string'),
    leftCensored: csvDatum('response', r, `${name}_left_censored`, 'boolean', 'boolean'),
    rightCensored: csvDatum('response', r, `${name}_right_censored`, 'boolean', 'boolean'),
  });
  const intervalMetric = (r) => ({
    days: csvDatum('intervals', r, 'duration_days', 'd'),
    start: csvDatum('intervals', r, 'start_utc', 'UTC', 'string'),
    end: csvDatum('intervals', r, 'end_utc', 'UTC', 'string'),
    leftCensored: csvDatum('intervals', r, 'left_censored', 'boolean', 'boolean'),
    rightCensored: csvDatum('intervals', r, 'right_censored', 'boolean', 'boolean'),
  });
  for (const r of rows) {
    const matching = tables.intervals.filter(
      (i) =>
        i.configuration === r.configuration &&
        i.observer_convention === r.observer_convention &&
        i.scope === r.scope,
    );
    const containing = (name) => {
      const i = matching.find(
        (i) =>
          i.metric === name &&
          i.start_utc <= r.simultaneous_start_utc &&
          i.end_utc >= r.simultaneous_end_utc,
      );
      if (!i) throw new Error(`No containing ${name} episode for ${r.configuration}`);
      return intervalMetric(i);
    };
    const pairwise = tables.pairwise.find(
      (p) =>
        p.scope === r.scope &&
        p.observer_convention === r.observer_convention &&
        p.first === 'P78_5m' &&
        p.second === r.configuration &&
        p.metric === 'simultaneous',
    );
    if (pairwise && pairwise.delta_days !== r.simultaneous_delta_5m_days)
      throw new Error('Frozen comparison mismatch');
    cases[key(r.configuration, r.observer_convention, r.scope)] = {
      id: r.configuration,
      observer: r.observer_convention,
      domain: r.scope,
      simultaneous: metric(r, 'simultaneous'),
      sun: metric(r, 'sun'),
      earth: metric(r, 'earth'),
      timeline: { sun: containing('sun'), earth: containing('earth') },
      delta: csvDatum('response', r, 'simultaneous_delta_5m_days', 'd'),
      ground: csvDatum('response', r, 'ground_height_m', 'm above reference radius'),
      aboveGround: csvDatum('response', r, 'observer_above_ground_m', 'm'),
      absoluteHeight: csvDatum(
        'response',
        r,
        'absolute_observer_height_m',
        'm above reference radius',
      ),
      nominalHorizon: csvDatum('response', r, 'horizon_at_nominal_solar_azimuth_deg', 'deg'),
      onsetAzimuth: csvDatum('response', r, 'late_solar_onset_azimuth_deg', 'deg'),
    };
  }
  const witnessFields = {
    time_utc: ['UTC', 'string'],
    target_azimuth_deg: ['deg'],
    target_elevation_deg: ['deg'],
    interpolated_horizon_deg: ['deg'],
    surface_range_m: ['m'],
    azimuth_deg: ['deg'],
    horizon_elevation_deg: ['deg'],
    witness_height_m: ['m above reference radius'],
    source_row: ['pixel row'],
    source_col: ['pixel column'],
  };
  const witnesses = tables.witnesses
    .filter(
      (r) =>
        r.bracketing_ray === 'lower' &&
        ['own_late_solar_onset', 'nominal5m_late_solar_onset_time'].includes(r.diagnostic),
    )
    .map((r) => ({
      id: r.configuration,
      observer: r.observer_convention,
      diagnostic: r.diagnostic,
      ...Object.fromEntries(
        Object.entries(witnessFields).map(([f, [u, t]]) => [f, csvDatum('witnesses', r, f, u, t)]),
      ),
    }));
  const supportLabels = {
    p78_direct_count: ['Direct LOLA count · Product 78', 'count', 0],
    p78_elevation_rms_m: ['Elevation RMS · Product 78', 'm', 6],
    p90_effective_resolution_m: ['Effective resolution field · Product 90', 'm', 4],
    p104_illuminated_input_image_count: ['Illuminated input images · Product 104', 'count', 0],
    p104_best_input_resolution_m: ['Best input image resolution · Product 104', 'm', 1],
  };
  const support = Object.entries(supportLabels).map(([field, [label, unit, digits]]) => {
    const r = tables.support.find(
      (r) =>
        r.configuration === 'P78_5m' &&
        r.observer_convention === 'fixed_absolute' &&
        r.diagnostic === 'own_late_solar_onset' &&
        r.bracketing_ray === 'lower' &&
        r.field === field,
    );
    if (!r) throw new Error(`Missing support field: ${field}`);
    return {
      id: field,
      label,
      digits,
      datum: csvDatum('support', r, 'center', unit),
      sampling: r.sampling,
      sourceRaster: r.path,
    };
  });
  const profileFiles = {},
    sectionFiles = {};
  let skylineMin = Infinity,
    skylineMax = -Infinity;
  await mkdir(path.join(webRoot, 'public/evidence/profiles'), { recursive: true });
  for (const [solutionId, solution] of Object.entries(ladder.solutions)) {
    const sourceId = `horizon-${solutionId}`;
    await source(sourceId, solution.model_path);
    const horizon = await readJSON(solution.model_path);
    const rays = horizon.witnesses
      .map((r, i) => [r.azimuth_deg, r.horizon_elevation_deg, i])
      .filter((r) => r[0] >= 40 && r[0] <= 170);
    for (const [, elevation] of rays) {
      skylineMin = Math.min(skylineMin, elevation);
      skylineMax = Math.max(skylineMax, elevation);
    }
    const url = `/evidence/profiles/${solutionId}.v1.json`;
    profileFiles[solutionId] = {
      url,
      source: ref(sourceId, 'azimuth_deg,horizon_elevation_deg', undefined, '/witnesses'),
      units: ['deg azimuth', 'deg elevation', 'original witness index'],
      count: rays.length,
    };
    await writeFile(
      path.join(webRoot, 'public', url),
      JSON.stringify({
        schema: 'resolve.skyline.v1',
        id: solution.configuration.id,
        observer: solution.observer_convention,
        source: profileFiles[solutionId].source,
        rays,
      }) + '\n',
    );
  }
  for (const id of modelIds) {
    const sections = mechanism.profiles
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => p.configuration.id === id)
      .map(({ p, i }) => ({
        direction: p.direction,
        azimuth: jsonDatum('mechanism', p.azimuth_deg, 'deg', `/profiles/${i}/azimuth_deg`),
        source: ref('mechanism', 'range_m,height_m', undefined, `/profiles/${i}`),
        samples: p.range_m
          .map((r, j) => [r, p.height_m[j], j])
          .filter(([r]) => r <= (p.direction === 'nominal_5m_critical' ? 200 : 3000)),
      }));
    const url = `/evidence/profiles/${id}.sections.v1.json`;
    sectionFiles[id] = {
      url,
      units: ['m surface range', 'm above reference radius', 'original sample index'],
    };
    await writeFile(
      path.join(webRoot, 'public', url),
      JSON.stringify({ schema: 'resolve.sections.v1', id, sections }) + '\n',
    );
  }
  const data = {
    schema: 'resolve.audit.v1',
    experiment: 'R-01C',
    site: 'dGR101',
    year: '2026',
    region: 'de Gerlache region',
    observable: 'Predicted simultaneous Sun/Earth visibility window',
    semantics: 'Geometric center clearance',
    classification: 'MODEL-SENSITIVE',
    classificationScope:
      'Classification applies to this site + observable + analysis definition + evaluated model set.',
    defaults: {
      id: 'P78_5m',
      comparison: 'P90_80m',
      observer: 'fixed_absolute',
      domain: 'uncensored_intersecting_registered',
    },
    geometry: {
      latitude: jsonDatum(
        'manifest',
        manifest.geometry.latitude_deg,
        'deg',
        '/geometry/latitude_deg',
      ),
      longitude: jsonDatum(
        'manifest',
        manifest.geometry.longitude_east_deg,
        'deg east',
        '/geometry/longitude_east_deg',
      ),
      radius: jsonDatum(
        'manifest',
        manifest.geometry.reference_radius_m,
        'm',
        '/geometry/reference_radius_m',
      ),
      frame: manifest.geometry.frame,
      translation: manifest.geometry.translation,
      aberration: manifest.geometry.aberration,
    },
    domains: {
      registered_domain: {
        label: 'Registered domain',
        description: 'Nov 6–28, 2026 UTC. Episodes are clipped at the registered boundaries.',
      },
      uncensored_intersecting_registered: {
        label: 'Complete intervals',
        description:
          'Uncensored modeled episodes intersecting Nov 6–28, 2026. Episodes can extend beyond the registered domain.',
      },
    },
    representations,
    cases,
    witnesses,
    support,
    profileFiles,
    sectionFiles,
    sources,
    plotDomains: {
      azimuth: [40, 170],
      elevation: [Math.floor(skylineMin / 2) * 2, Math.ceil(skylineMax / 2) * 2],
      unit: 'deg',
      purpose: 'Shared display axis enclosing all frozen profile samples; no geometry calculation.',
    },
    limitations: mechanism.limitations,
    links: [
      { label: 'NASA PGDA · Product 78', url: 'https://pgda.gsfc.nasa.gov/products/78' },
      { label: 'NASA PGDA · Product 90', url: 'https://pgda.gsfc.nasa.gov/products/90' },
      { label: 'NASA PGDA · Product 104', url: 'https://pgda.gsfc.nasa.gov/products/104' },
      {
        label: 'NASA/JPL · SPICE DE421 kernel archive',
        url: 'https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/',
      },
    ],
  };
  const findingLines = (await readFile(path.join(scienceRoot, paths.finding), 'utf8')).split(
    /\r?\n/,
  );
  const quotedNumber = (pattern, unit) => {
    const i = findingLines.findIndex((line) => pattern.test(line));
    if (i < 0) throw new Error('Missing frozen finding number');
    const original = findingLines[i].match(pattern)[1];
    return {
      value: Number(original),
      original,
      unit,
      source: { sourceId: 'finding', field: 'reported value', line: i + 1 },
    };
  };
  data.reportedComparisons = {
    sdemGroundOffset: quotedNumber(/^(1\.325806) m higher than SL2/, 'm'),
    alignedRange: quotedNumber(/aligned ray at (49\.000) m distance/, 'm'),
    aligned80Minus5Height: quotedNumber(/represented height is (-1\.647339) m/, 'm'),
  };
  await mkdir(path.join(webRoot, 'src/data'), { recursive: true });
  await writeFile(path.join(webRoot, 'src/data/audit.v1.json'), JSON.stringify(data) + '\n');
  await writeFile(
    path.join(webRoot, 'evidence/product-sources.json'),
    JSON.stringify(sources, null, 2) + '\n',
  );
  // The reviewed brief is retained in docs/B01_BRIEF.txt as a project document.
  // Building scientific product records must not depend on a chat attachment.
  console.log(
    `Extracted ${rows.length} frozen result cases, ${witnesses.length} witnesses, ${Object.keys(profileFiles).length} lazy sky profiles; no scientific calculation.`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await extract({ verifyOnly: process.argv.includes('--verify-only') });
