# Scientific limitations

- Five official local terrain clones are a pilot, not a calibrated probability
  distribution. Agreement does not exclude instability in untested realizations,
  locations, operational starts or requirements. No universal H0 acceptance or
  global H1 falsification follows from this finite experiment.
- The recomputed season-wide nominal window is well above 6.5 days, so this
  particular primary configuration is less informative about near-threshold
  decisions than the motivating seven-day literature reference suggested.
  The preregistered operational grid is intentionally retained even if all of
  its starts are unfavorable; it is not moved to manufacture disagreement.
- Far-field 80/240 m LOLA terrain is held fixed across local clones. Earth
  horizon witnesses can lie about 84 km away, beyond the 20 km clone footprint.
  Far-field uncertainty and correlations with local errors are not propagated.
- A 250 km finite horizon extent and tested cutoff convergence do not prove
  global horizon completeness. Rays use 0.1-degree azimuth spacing and finite
  radial steps; bilinear interpolation and periodic azimuth interpolation can
  miss narrow terrain extrema. The 0.2/0.1-degree and 2.5/1.25 m checks establish
  numerical sensitivity within the tested discretizations, not absolute truth.
- Event refinement is numerical. A 300 s discovery grid can still miss shorter
  events, tangencies or a pair of roots inside one cell. Agreement with 600 s
  sampling is evidence, not proof of their absence. Millisecond-formatted UTC
  timestamps do not imply millisecond physical accuracy.
- The original candidate shapefile and rounded table point differ by several
  metres. The source shapefile confirms longitude direction; the primary run
  uses the published rounded coordinate. Absolute geolocation, datum and
  registration errors are not fully sampled by the selected clones.
- Primary celestial geometry uses simultaneous geometric centers (`NONE`),
  with no finite-disc, light-time, stellar aberration, refraction or relay
  analysis. Sun visibility is not electrical power and Earth-center visibility
  is not a verified radio link or a DSN-station visibility prediction.
- Directions are frozen at the nominal observer Cartesian radius for each
  terrain-only comparison; horizons use 2 m above each inferred terrain
  surface. This isolates terrain shape/height effects while excluding the
  metre-scale topocentric-parallax change from the primary comparison.
- Product 104 inherits the LOLA geodetic reference through the documented
  registration chain. Its TIFF's model-year label does not encode a SPICE
  ephemeris ID. This inherited identity is a justified source-chain assumption,
  not an independent orientation measurement. It is enhanced terrain, not
  independent ground truth. Its simulated-image uncertainty is not a complete
  absolute terrain error budget; image support is uneven and poor in shadow.
- The literature-domain result is clipped at November 28 00:00 UTC and differs
  from the approximate seven-day reference. The difference has not been
  uniquely attributed. The source uses different terrain/spatial sampling,
  12-hour temporal sampling and a 150 km shadow model; exact disc semantics and
  the full modeling implementation have not been independently reproduced.
- The historical 6.5-day value is a research benchmark, not a statement about
  current NASA operational requirements or mission authorization.
