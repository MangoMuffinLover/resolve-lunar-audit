import { readFile, writeFile, mkdir, stat, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest, parseCSV, scienceRoot, webRoot, extract } from './extract.mjs';

const metrics = ['sun', 'earth', 'simultaneous'];
const observers = ['fixed_absolute', 'each_surface_2m'];
const domains = ['registered_domain', 'uncensored_intersecting_registered'];
const models = [
  'P78_5m',
  'P90_20m',
  'P90_40m',
  'P90_60m',
  'P90_80m',
  'P90_240m',
  'P104_5m',
  'SYNTHETIC_59p88m',
];
const factorDefinitions = [
  {
    id: 'terrain',
    label: 'Terrain representation',
    kind: 'Representation response',
    description:
      'Compare evaluated terrain products or a labeled synthetic control. Spacing, processing and alignment can differ.',
  },
  {
    id: 'temporal',
    label: 'Temporal sampling & estimator',
    kind: 'Numerical / reporting comparison',
    description:
      'Separate event-search convergence from discrete sampling and duration-estimator choices.',
  },
  {
    id: 'observer',
    label: 'Observer definition / height',
    kind: 'Configuration change',
    description:
      'Compare specified observer conventions or physical height settings. These alter the modeled observer.',
  },
  {
    id: 'semantics',
    label: 'Visibility definition',
    kind: 'Changed observable',
    description: 'Center, any-disc and full-disc visibility ask different physical questions.',
  },
  {
    id: 'domain',
    label: 'Domain & censoring',
    kind: 'Reporting-policy change',
    description:
      'Compare clipped reporting intervals or complete relevant episodes. An analysis boundary is not a physical sunset.',
  },
  {
    id: 'stochastic',
    label: 'Terrain realizations',
    kind: 'Limited clone pilot',
    description:
      'Inspect the first five official local terrain clones. This is not a calibrated probability distribution.',
  },
];

export async function extractFactors() {
  const sources = {},
    csv = {},
    json = {};
  async function source(id, relative, download = false) {
    const full = path.join(scienceRoot, relative),
      content = await readFile(full, 'utf8');
    sources[id] = { path: relative, sha256: await digest(full), bytes: (await stat(full)).size };
    if (download) {
      sources[id].href = `/evidence/factors/sources/${path.basename(relative)}`;
      await mkdir(path.join(webRoot, 'public/evidence/factors/sources'), { recursive: true });
      await copyFile(full, path.join(webRoot, 'public', sources[id].href));
    }
    if (relative.endsWith('.csv')) csv[id] = parseCSV(content);
    if (relative.endsWith('.json')) json[id] = JSON.parse(content);
  }
  await source('r01c-response', 'results/r01c/resolution_response.csv', true);
  await source('r01b-ladder', 'results/tables/model_fidelity_ladder.csv', true);
  await source('pilot-table', 'results/tables/terrain_ensemble_pilot.csv', true);
  await source('r01b-checks', 'data/processed/r01b/validation_checks.json');
  await source('screen-checks', 'data/processed/r01b/multisite_validation.json');
  await source('temporal-checks', 'data/processed/r01b/final_temporal_validation.json');
  await source('pilot-gate', 'data/processed/nominal_validation.json');
  await source('taxonomy', 'research/r01b/decision_taxonomy.md', true);
  await source('r01c-finding', 'results/r01c/R01C_FINDING.md');
  await source('r01b-finding', 'results/R01B_FINAL_REPORT.md');
  await source('pilot-protocol', 'research/r01/protocol/hypotheses.md');
  await source('pilot-method', 'scripts/run_pilot.py');
  if (
    !json['screen-checks'].passed ||
    !json['temporal-checks'].passed ||
    !json['pilot-gate'].pilot_gate_passed
  )
    throw new Error('Saved scientific validation gate failed');
  if (
    json['r01b-checks'].finite_disc_convergence.some(
      (c) => !c.event_counts_equal || Math.abs(c.duration_change_s) > 0.05,
    )
  )
    throw new Error('Finite-disc convergence gate failed');
  const records = Object.fromEntries(
    ['dGR101', 'dGR203'].map((id) => [
      id,
      {
        schema: 'resolve.factors.site.v1',
        site: id,
        measurements: {},
        comparisons: [],
        scopes: {},
      },
    ]),
  );
  function evidence(value, original, unit, sourceId, field, location) {
    return { value, original, unit, source: { sourceId, field, ...location } };
  }
  function csvMeasurement(record, id, sourceId, row, metric, prefix = '', flagData = null) {
    if (record.measurements[id]) return id;
    if (!row) throw new Error(`Missing scientific row for ${id}`);
    const location = { row: row.row };
    const get = (field, unit, kind = 'string') => {
      const original = row[field];
      if (original === undefined || original === '') throw new Error(`Missing ${field} for ${id}`);
      const value =
        kind === 'number' ? Number(original) : kind === 'boolean' ? original === 'True' : original;
      if (kind === 'number' && !Number.isFinite(value))
        throw new Error('Nonfinite scientific value');
      if (kind === 'boolean' && !['True', 'False'].includes(original))
        throw new Error('Invalid source boolean');
      return evidence(value, original, unit, sourceId, field, location);
    };
    const duration = get(`${prefix}${metric}_days`, 'd', 'number');
    const censor = (side) =>
      flagData
        ? evidence(
            flagData.value.longest[metric][`${side}_censored`],
            String(flagData.value.longest[metric][`${side}_censored`]),
            'boolean',
            flagData.source,
            `${side}_censored`,
            { pointer: `/longest/${metric}/${side}_censored` },
          )
        : get(`${metric}_${side}_censored`, 'boolean', 'boolean');
    record.measurements[id] = {
      id,
      days: duration.value,
      duration,
      start: get(`${prefix}${metric}_start_utc`, 'UTC'),
      end: get(`${prefix}${metric}_end_utc`, 'UTC'),
      leftCensored: censor('left'),
      rightCensored: censor('right'),
    };
    return id;
  }
  function jsonMeasurement(record, id, sourceId, pointer, w) {
    if (record.measurements[id]) return id;
    if (!w) throw new Error(`Missing saved interval ${id}`);
    const get = (field, unit) =>
      evidence(w[field], String(w[field]), unit, sourceId, field, {
        pointer: `${pointer}/${field}`,
      });
    const duration = get('duration_s', 's');
    record.measurements[id] = {
      id,
      days: duration.value / 86400,
      duration,
      start: get('start_utc', 'UTC'),
      end: get('end_utc', 'UTC'),
      leftCensored: get('left_censored', 'boolean'),
      rightCensored: get('right_censored', 'boolean'),
    };
    return id;
  }
  function add(record, details, before, after) {
    const values = Object.fromEntries(
      metrics.map((metric) => [metric, { before: before(metric), after: after(metric) }]),
    );
    for (const pair of Object.values(values))
      pair.deltaDays = record.measurements[pair.after].days - record.measurements[pair.before].days;
    record.comparisons.push({
      ...details,
      values,
      deltaDefinition:
        'After minus before, derived only from the two stored source durations. Effects are not additive.',
    });
  }
  const cRow = (model, observer, domain) =>
    csv['r01c-response'].find(
      (r) => r.configuration === model && r.observer_convention === observer && r.scope === domain,
    );
  const cPoint = (model, observer, domain, metric) =>
    csvMeasurement(
      records.dGR101,
      `c-${model}-${observer}-${domain}-${metric}`,
      'r01c-response',
      cRow(model, observer, domain),
      metric,
    );
  const cScope = (factor, observer, domain) => {
    const id = `r01c-${factor}-${observer}-${domain}`;
    records.dGR101.scopes[id] = {
      id,
      site: 'dGR101',
      experiment: 'R-01C refined native-product experiment',
      coordinates: 'Archived point: 88.5134116385° S, 68.0146092653° W',
      domain:
        factor === 'domain'
          ? 'Clipped Nov 6–28 versus complete relevant episodes'
          : domain === 'registered_domain'
            ? 'Nov 6–28, 2026 UTC, clipped'
            : 'Complete episodes intersecting Nov 6–28, 2026 UTC',
      observer:
        factor === 'observer'
          ? 'Fixed absolute elevation versus 2 m above each represented surface'
          : observer === 'fixed_absolute'
            ? 'Common absolute observer elevation'
            : '2 m above each represented surface; absolute elevation varies across products',
      semantics: 'Geometric Sun/Earth centers, DE421 / MOON_ME_DE421, aberration NONE',
      held:
        factor === 'terrain'
          ? [
              'Same archived site, ephemeris and visibility observable',
              'Same observer convention and episode selection policy',
              'Same local replacement footprint and unchanged exterior terrain',
            ]
          : factor === 'observer'
            ? [
                'Same site, terrain product, ephemeris and visibility observable',
                'Same episode selection policy; absolute observer position is allowed to change',
              ]
            : ['Same site, terrain product, observer, ephemeris and visibility observable'],
      changed:
        factor === 'terrain'
          ? observer === 'fixed_absolute'
            ? 'Terrain representation, including spacing, processing and alignment; absolute observer elevation is held fixed'
            : 'Terrain representation and the corresponding absolute observer elevation under the same 2 m surface-relative convention'
          : factor === 'observer'
            ? 'Observer elevation convention and the corresponding geometry/horizon'
            : factor === 'domain'
              ? 'Reporting domain and selection of the longest relevant complete versus clipped interval'
              : '150-second versus 75-second discovery cadence with the same refined horizon and event estimator',
      qualification:
        factor === 'domain'
          ? 'Longest-interval selection can switch episode identity, especially for Sun-only results. Compare both endpoint pairs; this is not a terrain-induced transition.'
          : factor === 'temporal'
            ? 'This is a numerical convergence comparison, not a physical accuracy bound. Both runs use event refinement; these are not coarse discrete-cell estimates.'
            : factor === 'observer'
              ? 'This changes the specified observer. Neither convention is universally preferred, and the change is not evidence of operational fragility.'
              : 'A representation response is not absolute terrain truth or proof of convergence. Synthetic averaging remains separate from native NASA products.',
    };
    return id;
  };
  for (const observer of observers)
    for (const domain of domains)
      for (const model of models) {
        const row = cRow(model, observer, domain);
        if (!row) throw new Error('Missing R-01C case');
        add(
          records.dGR101,
          {
            id: `terrain-${model}-${observer}-${domain}`,
            factor: 'terrain',
            scope: cScope('terrain', observer, domain),
            variant: model,
            observer,
            domain,
            label: row.label,
            beforeLabel: 'P78 SL2 5 m reference',
            afterLabel: row.label,
            badge: model.startsWith('SYNTHETIC')
              ? 'Synthetic area-averaged control'
              : model === 'P104_5m'
                ? 'Separate 5 m SDEM'
                : model === 'P78_5m'
                  ? 'Reference only'
                  : 'Native NASA product',
            kind: 'Representation response',
          },
          (metric) => cPoint('P78_5m', observer, domain, metric),
          (metric) => cPoint(model, observer, domain, metric),
        );
        const sourceId = `temporal-${model}-${observer}`;
        if (!sources[sourceId])
          await source(sourceId, `data/processed/r01c/${model}_refined_${observer}_solution.json`);
        const saved = json[sourceId];
        if (
          !saved.valid ||
          saved.stage !== 'refined' ||
          saved.registered.sampling_step_s !== 150 ||
          saved.final_75s_visibility.sampling_step_s !== 75 ||
          !saved.temporal_validation.every((t) => t.passed)
        )
          throw new Error('Unaccepted R-01C temporal comparison');
        add(
          records.dGR101,
          {
            id: `temporal-${model}-${observer}-${domain}`,
            factor: 'temporal',
            scope: cScope('temporal', observer, domain),
            variant: model,
            observer,
            domain,
            label: row.label,
            beforeLabel: '150 s discovery + event refinement',
            afterLabel: '75 s discovery + event refinement',
            badge: 'Numerical check',
            kind: 'Same-observable numerical comparison',
          },
          (metric) => {
            const registered = domain === 'registered_domain';
            const pointer = registered
              ? `/registered/longest/${metric}`
              : `/uncensored/longest_relevant/${metric}`;
            return jsonMeasurement(
              records.dGR101,
              `t150-${model}-${observer}-${domain}-${metric}`,
              sourceId,
              pointer,
              registered
                ? saved.registered.longest[metric]
                : saved.uncensored.longest_relevant[metric],
            );
          },
          (metric) => cPoint(model, observer, domain, metric),
        );
      }
  for (const domain of domains)
    for (const model of models) {
      const row = cRow(model, 'fixed_absolute', domain);
      add(
        records.dGR101,
        {
          id: `observer-${model}-${domain}`,
          factor: 'observer',
          scope: cScope('observer', 'paired', domain),
          variant: model,
          domain,
          label: row.label,
          beforeLabel: 'Fixed absolute observer',
          afterLabel: '2 m above this represented surface',
          badge: 'Observer convention',
          kind: 'Changed observer definition',
        },
        (metric) => cPoint(model, 'fixed_absolute', domain, metric),
        (metric) => cPoint(model, 'each_surface_2m', domain, metric),
      );
    }
  for (const observer of observers)
    for (const model of models) {
      const row = cRow(model, observer, 'registered_domain');
      add(
        records.dGR101,
        {
          id: `domain-${model}-${observer}`,
          factor: 'domain',
          scope: cScope('domain', observer, 'paired'),
          variant: model,
          observer,
          label: row.label,
          beforeLabel: 'Registered clipped interval',
          afterLabel: 'Complete relevant episode',
          badge: 'Reporting policy',
          kind: 'Changed domain / episode selection',
        },
        (metric) => cPoint(model, observer, 'registered_domain', metric),
        (metric) => cPoint(model, observer, 'uncensored_intersecting_registered', metric),
      );
    }
  // A matched visibility-definition comparison exists on the earlier R-01B
  // primary grid. It must not be substituted for the refined R-01C baseline.
  await source('dgr101-center-primary', 'data/processed/r01b/dGR101_center_5m_visibility.json');
  await source('dgr101-any-primary', 'data/processed/r01b/dGR101_any_disc_5m_visibility.json');
  const semanticsScope = 'r01b-dgr101-semantics';
  records.dGR101.scopes[semanticsScope] = {
    id: semanticsScope,
    site: 'dGR101',
    experiment: 'R-01B primary site screen — separate from R-01C',
    coordinates: 'Same archived dGR101 point',
    domain: 'Nov 6–28, 2026 UTC, clipped',
    observer: 'Primary P78 nominal 2 m observer and frozen nominal geometry',
    semantics: 'Center-visible versus any part of each spherical body visible',
    held: [
      'Same primary 0.1° / radial-factor-1 P78 horizon',
      'Same site, observer, ephemeris, domain and 300 s event-search cadence',
    ],
    changed: 'The visibility acceptance criterion: geometric center versus any-disc',
    qualification:
      'These are different physical observables. The 5.40-day center baseline is from the earlier primary grid and must not be relabeled as the refined 7.40-day complete R-01C case. Spherical caps omit Earth oblateness, phase and radiance weighting.',
  };
  add(
    records.dGR101,
    {
      id: 'semantics-any-primary',
      factor: 'semantics',
      scope: semanticsScope,
      variant: 'any_disc',
      label: 'Any-disc versus center visibility',
      beforeLabel: 'Geometric centers',
      afterLabel: 'Any part of each spherical disc',
      badge: 'R-01B primary grid',
      kind: 'Changed observable',
    },
    (metric) =>
      jsonMeasurement(
        records.dGR101,
        `b101-center-${metric}`,
        'dgr101-center-primary',
        `/longest/${metric}`,
        json['dgr101-center-primary'].longest[metric],
      ),
    (metric) =>
      jsonMeasurement(
        records.dGR101,
        `b101-any-${metric}`,
        'dgr101-any-primary',
        `/longest/${metric}`,
        json['dgr101-any-primary'].longest[metric],
      ),
  );

  const b = records.dGR203,
    control = csv['r01b-ladder'].find((r) => r.experiment === 'control_center_events');
  const bPoint = (row, metric) =>
    csvMeasurement(b, `b203-${row.experiment}-${metric}`, 'r01b-ladder', row, metric);
  const groups = {
    terrain: ['terrain_product104', 'terrain_average60'],
    temporal: ['time_12h', 'time_1h', 'time_10min', 'time_12h_sample_span'],
    observer: ['height_1m', 'height_5m'],
    semantics: ['disc_any', 'disc_full'],
    domain: ['endpoint_nov27_00', 'endpoint_nov27_12'],
  };
  const labels = {
    terrain_product104: 'Product 104 SDEM',
    terrain_average60: 'Synthetic area-averaged 59.88 m control',
    time_12h: '12-hour discrete cells',
    time_1h: '1-hour discrete cells',
    time_10min: '10-minute discrete cells',
    time_12h_sample_span: '12-hour first/last sample span',
    height_1m: 'Observer height 1 m',
    height_5m: 'Observer height 5 m',
    disc_any: 'Any part of each spherical disc',
    disc_full: 'Entire spherical discs',
    endpoint_nov27_00: 'End domain on Nov 27, 00:00 UTC',
    endpoint_nov27_12: 'End domain on Nov 27, 12:00 UTC',
  };
  const qualifications = {
    terrain:
      'Nominal celestial geometry is held fixed, but horizon ray origins follow 2 m above each represented ground. This is not a common-absolute-ray-origin control. Synthetic averaging and Product 104 are not independent terrain truth.',
    temporal:
      'Discrete-cell estimates do not prove between-sample continuity. The sample-span diagnostic changes the duration statistic. These choices are not the same as refining an event solver.',
    observer:
      'Physical observer height changes between 1, 2 and 5 m. This is not the R-01C fixed-absolute versus surface-relative convention comparison.',
    semantics:
      'Center, any-disc and full-disc are different observables. Spherical caps omit Earth oblateness, phase and radiance weighting; a difference does not establish model error for an unchanged requirement.',
    domain:
      'Only the reporting endpoint changes; a clipped endpoint is not a physical transition. The historical seven-versus-8.47-day discrepancy remains unresolved.',
  };
  for (const [factor, experiments] of Object.entries(groups)) {
    const id = `r01b-dgr203-${factor}`;
    b.scopes[id] = {
      id,
      site: 'dGR203',
      experiment: 'R-01B dGR203 replication controls',
      coordinates: 'Published rounded point: 88.141° S, 71.696° W',
      domain:
        factor === 'domain'
          ? 'Nov 6 start; compare Nov 28 versus the stated earlier endpoint'
          : 'Nov 6–28, 2026 UTC, clipped',
      observer:
        factor === 'observer'
          ? 'P78 ground; physical height 1 / 2 / 5 m'
          : 'Nominal 2 m configuration; terrain alternatives retain their documented ray-origin convention',
      semantics:
        factor === 'semantics'
          ? 'Geometric center versus spherical finite-disc criteria'
          : 'Geometric Sun/Earth centers, MOON_ME_DE421 / DE421',
      held:
        factor === 'terrain'
          ? [
              'Same published site, domain, visibility criterion and nominal ephemeris geometry',
              'Unchanged exterior terrain',
            ]
          : factor === 'observer'
            ? [
                'Same site, terrain representation, domain and visibility criterion',
                'Same horizon sampling rules; observer geometry follows height',
              ]
            : [
                'Same site, P78 horizon and observer configuration',
                factor === 'domain'
                  ? 'Same center criterion and event solver'
                  : 'Same Nov 6–28 domain',
              ],
      changed: factorDefinitions.find((f) => f.id === factor).label,
      qualification: qualifications[factor],
    };
    for (const experiment of experiments) {
      const row = csv['r01b-ladder'].find((r) => r.experiment === experiment);
      if (!row) throw new Error('Missing R-01B experiment');
      add(
        b,
        {
          id: experiment,
          factor,
          scope: id,
          variant: experiment,
          label: labels[experiment],
          beforeLabel: 'Center-event control, 2 m, Nov 6–28',
          afterLabel: labels[experiment],
          badge:
            experiment === 'terrain_average60'
              ? 'Synthetic control'
              : factor === 'semantics'
                ? 'Different observable'
                : factor === 'observer'
                  ? 'Height sensitivity'
                  : factor === 'domain'
                    ? 'Reporting endpoint'
                    : factor === 'temporal'
                      ? 'Estimator / cadence change'
                      : 'Alternative representation',
          kind:
            factor === 'semantics'
              ? 'Changed observable'
              : factor === 'domain'
                ? 'Changed reporting policy'
                : factor === 'temporal'
                  ? 'Changed estimator / sampling'
                  : 'Specified configuration comparison',
        },
        (metric) => bPoint(control, metric),
        (metric) => bPoint(row, metric),
      );
    }
  }
  const pilotScope = 'r01a-dgr203-five-clones';
  b.scopes[pilotScope] = {
    id: pilotScope,
    site: 'dGR203',
    experiment: 'R-01A first-five official local-clone pilot',
    coordinates: 'Published rounded point: 88.141° S, 71.696° W',
    domain: 'Oct 1–Dec 15, 2026 UTC — separate seasonal search',
    observer:
      '2 m above each represented ground for horizon rays; nominal celestial geometry fixed',
    semantics: 'Geometric Sun/Earth centers; 600 s discovery with event refinement',
    held: [
      'Same site, full seasonal search, local height convention and nominal celestial geometry',
      'Unchanged 80/240 m exterior terrain; first five clones in source order',
    ],
    changed: 'Official local terrain realization and its surface-relative ray origin',
    qualification:
      'Five tested clones are not a calibrated probability distribution. The approximately 13.23-day seasonal interval must not be mixed with the 8.47-day clipped replication result. Local perturbations do not cover far-field or all systematic uncertainty. All five retained the historical 6.5-day simultaneous classification; this is a descriptive pilot result.',
  };
  const nominal = csv['pilot-table'].find((r) => r.terrain === 'nominal');
  for (const name of [
    'nominal',
    ...Array.from({ length: 5 }, (_, i) => `clone_${String(i + 1).padStart(4, '0')}`),
  ])
    await source(
      `pilot-${name}`,
      `data/processed/${name === 'nominal' ? 'nominal' : name}_visibility.json`,
    );
  const pilotPoint = (row, metric) =>
    csvMeasurement(b, `pilot-${row.terrain}-${metric}`, 'pilot-table', row, metric, 'longest_', {
      source: `pilot-${row.terrain}`,
      value: json[`pilot-${row.terrain}`],
    });
  for (let i = 1; i <= 5; i++) {
    const name = `clone_${String(i).padStart(4, '0')}`,
      row = csv['pilot-table'].find((r) => r.terrain === name);
    add(
      b,
      {
        id: name,
        factor: 'stochastic',
        scope: pilotScope,
        variant: name,
        label: `Official clone ${String(i).padStart(4, '0')}`,
        beforeLabel: 'Nominal seasonal model',
        afterLabel: `Official clone ${String(i).padStart(4, '0')}`,
        badge: 'Five-realization pilot',
        kind: 'Limited local terrain-realization comparison',
      },
      (metric) => pilotPoint(nominal, metric),
      (metric) => pilotPoint(row, metric),
    );
  }
  for (const info of Object.values(sources))
    if ((await digest(path.join(scienceRoot, info.path))) !== info.sha256)
      throw new Error('Scientific input changed during factor extraction');
  const output = path.join(webRoot, 'public/evidence/factors');
  await mkdir(output, { recursive: true });
  const sites = [];
  for (const record of Object.values(records)) {
    const filename = `${record.site}.v1.json`,
      full = path.join(output, filename);
    await writeFile(full, JSON.stringify(record) + '\n');
    sites.push({
      id: record.site,
      href: `/evidence/factors/${filename}`,
      sha256: await digest(full),
      bytes: (await stat(full)).size,
      comparisons: record.comparisons.length,
      coverage: Object.fromEntries(
        factorDefinitions.map((f) => [
          f.id,
          record.comparisons.filter((c) => c.factor === f.id).length,
        ]),
      ),
    });
  }
  const manifest = {
    schema: 'resolve.factors.v1',
    factors: factorDefinitions,
    metrics: [
      { id: 'simultaneous', label: 'Sun & Earth together' },
      { id: 'sun', label: 'Sun only' },
      { id: 'earth', label: 'Earth only' },
    ],
    models: models.map((id) => ({
      id,
      label: cRow(id, 'fixed_absolute', 'uncensored_intersecting_registered').label,
    })),
    sites,
    sources,
    unassessed: {
      dGR101: {
        stochastic:
          'No matched official-clone pilot was run at dGR101. The dGR203 pilot does not establish this site’s terrain uncertainty.',
      },
      dGR203: {},
    },
    limitations: [
      'Effects have their own baseline, site, observable and reporting domain; they are not additive and are not variance components.',
      'Changing the observable or reporting policy is not evidence of terrain-driven mission failure.',
      'A numerical convergence check is not an absolute terrain accuracy bound.',
      'Untested axes are unknown, not zero. No automatic STABLE, DATA-SENSITIVE or OPERATIONALLY FRAGILE classification is inferred here.',
      'The research taxonomy remains provisional. Historical thresholds do not certify mission feasibility.',
      'All shown differences are display arithmetic on frozen durations. No new terrain, ephemeris, interval or uncertainty experiment is run by this extractor.',
    ],
    generator: {
      path: 'web/scripts/extract-factors.mjs',
      sha256: await digest(fileURLToPath(import.meta.url)),
    },
  };
  await mkdir(path.join(webRoot, 'src/data'), { recursive: true });
  await writeFile(path.join(webRoot, 'src/data/factors.v1.json'), JSON.stringify(manifest) + '\n');
  await writeFile(path.join(output, 'manifest.v1.json'), JSON.stringify(manifest) + '\n');
  await writeFile(
    path.join(webRoot, 'evidence/factor-sources.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  );
  console.log(
    `B-03: ${sites.reduce((sum, s) => sum + s.comparisons, 0)} scoped comparisons, 3 observables, 6 factor families; frozen values retained, no new scientific run.`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await extract({ verifyOnly: true });
  await extractFactors();
}
