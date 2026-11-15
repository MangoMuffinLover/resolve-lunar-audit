# Exact-literature replication audit

Sources: [Wueller et al. 2026](https://doi.org/10.1029/2025JE009434), section
2.3, Table 2, section 4.2 and Table A2; [original author
archive](https://doi.org/10.5281/zenodo.17084058); [ACT TerrainShadows
tutorial landing link](https://www.actgate.com/post/quickmap-year-2022).

| Component | Status | Evidence and replication implication |
|---|---|---|
| 2026 date labels | KNOWN | Table 2: Nov 6–27, total 22 days. |
| Exact UTC start/end and endpoint inclusion | UNKNOWN | Date labels do not specify the final time or whether it was sampled. Nov 6 00 to Nov 28 00 is an INFERRED inclusive-calendar-day interpretation used in R-01A, not a quoted timestamp. |
| Observer height | KNOWN | Section 2.3 specifies 2 m surface offset. |
| Spatial sampling | KNOWN | 2D cartographic output at 60 m/pixel; archived output confirms 60 m. |
| Source DEM, its pyramid/resampler and alignment | UNKNOWN | 60 m output does not establish which terrain samples/levels were ray-traced. An averaged SL2 proxy is not exact replication. |
| Archived output grid phase | KNOWN | dGR2 2026 combined raster: x0=-58813.37933165705 m, y0=33219.535831595116 m; 350 x 350, 60 m cells. |
| Candidate extraction coordinate | INFERRED | Linked original candidate point is available; exact software extraction/resampling settings are not documented. Test archived point, published rounded point and output-cell center separately. |
| Temporal sampling | KNOWN | Section 2.3: 12-hour steps. UTC phase within those steps remains UNKNOWN. |
| Maximum shadow distance | KNOWN | Section 2.3: 150 km. |
| Ephemeris for midsummer calculation | KNOWN | Section 2.3 names DE441. |
| Ephemeris/orientation inside QuickMap shadow runs | UNKNOWN | The paper does not establish that all QuickMap shadow directions use that same translational/orientation configuration. |
| Software | KNOWN | ACT Lunar QuickMap TerrainShadows, 2D cartographic mode. Version/build and exact run settings are UNKNOWN. |
| Illumination acceptance | KNOWN | Consecutive non-zero modeled illumination values are counted. |
| Non-zero definition / disc radiance / numerical tolerance | UNKNOWN | The paper does not fully specify disc geometry, source phase, sampling or cutoff. Any/full spherical-disc tests are independent model choices, not claimed QuickMap equivalents. |
| Combined visibility output | KNOWN | Both Sun and simultaneous Sun/Earth results are produced. Exact Earth-disc, phase and boolean-combination implementation remains UNKNOWN. |
| Duration conversion | KNOWN | Original archive READ_ME: raster values count consecutive 12-hour increments; divide by two for days. This is stronger evidence than the paper's prose alone. |
| dGR203 published combined output | KNOWN | Original combined raster value 14 at the published point and its 3 x 3 neighborhood, hence 7 days. Table/point attribute agree. It is not an assumed ground truth. |
| Per-time illumination sequence and actual published longest interval | UNKNOWN | The inspected archive provides longest-run maps, not the underlying time sequence. Cannot compare transition timestamps directly. |
| Favorable screening | KNOWN | Section 4.2 defines at least 10 consecutive sunlit days including operational buffer. The 6.5-day historical duration is a separate benchmark; applying 10 days to simultaneous visibility is an additional diagnostic. |

## Metadata-driven additional controls (registered before their outcomes)

Read the real output grid as well as nominal terrain. The candidate's
published coordinate maps to source output row 258, column 88. The actual
output-cell center differs by about 20 m from the requested point. Test
pixel-center observer location separately, in addition to the extent-preserving
59.88 m proxy. An additional fully output-aligned 60 m DEM was not evaluated:
that output footprint extends beyond the existing SL2 local footprint, and
would require a separately specified edge/source-mixing policy.
Do not silently snap the primary control. These factors are motivated by
source metadata, not by whether they produce seven days.

The archive's count-of-increments conversion makes a first/last-sample-span
estimator a sensitivity diagnostic only; it is not the documented literature
duration rule. Exact date endpoints and 12-hour UTC phase remain unresolved.

## Archive consistency blocker

The archived dGR2 2026 Sun-only map has value **0** at the same candidate
pixel where the Sun-and-Earth map has **14 increments (7 days)**. The grids
match. If both files have the stated meanings, identical domain and identical
acceptance criterion, simultaneous visibility cannot last longer than solar
visibility. This conflicts with both the combined map and the published
SunDays26=7 point attribute. Preserve this source inconsistency; do not repair
or reinterpret a file to force agreement. Exact replication requires knowing
which underlying products/settings generated the published table. Counts,
checksums and neighborhoods are archived under data/interim/r01b.

## ACT tutorial evidence

The publicly linked ACT QTS Tutorial was read through the Google Docs
connector and preserved as a structured snapshot. Its current documentation
describes one or more point light sources, a virtual stack of available DEMs,
and several distinct outputs: brightness incorporating local incidence,
an incidence-only mask, and a terrain-obstruction shadow mask. A positive
surface offset changes how the latter is initialized. Exact selected output
band and source sampling in the Wueller run are still unknown, and a current
tutorial does not establish a historical configuration. Register a separate
local-facet incidence-gating sensitivity because non-zero shaded brightness
is not generally equivalent to unobstructed celestial-center visibility.
