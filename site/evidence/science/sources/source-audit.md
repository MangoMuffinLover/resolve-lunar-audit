# Native terrain source audit

Primary sources: [PGDA78](https://pgda.gsfc.nasa.gov/products/78),
[PGDA90](https://pgda.gsfc.nasa.gov/products/90),
[Barker et al. 2023](https://doi.org/10.3847/PSJ/acf3e1),
[PGDA104](https://pgda.gsfc.nasa.gov/products/104),
[Bertone et al.](https://doi.org/10.3847/PSJ/ae5b70).

Original Product90 COG windows retain native pixels and grid registration;
no overview or resampling was used. Exact source HTTP ranges, ETag/version
checks, byte-range SHA256 and extracted-raster SHA256 are preserved. Whole
remote-file SHA256 is unknown for partial acquisitions. Original fully
downloaded 80/240 m sources provide independent exact-pixel crop checks.
All listed DEMs include the fixed dGR101 point, with polar stereographic
metres and 1,737,400 m radius. Product78/90 document DE421 Mean Earth;
Product104 retains the LOLA geodetic reference and inherits that realization
through its prior rather than providing a new independent orientation test.
Metadata, source URLs, bounds and support fields are in raster_inventory.json.

The 20 m Product90 DEM uses the 80S adjusted point-cloud lineage identified
on its source page; other listed large-area grids use the 60S lineage.
Product78 local adjustments and Product104 image enhancement are additional
processing and native grid-alignment differences. Therefore W(r) is a product/representation response,
not a controlled proof that only nominal pixel size causes every difference.
The models share observations/geodetic ancestry; agreement is not independent
truth validation. Pixel spacing is not the effective terrain knowledge scale.

Product90 native count, effective-resolution and elevation-error rasters are
ingested separately at 20/40/60/80/240 m. Product104 image-count,
best-input-resolution and difference fields are descriptive ancillaries.
Its regional README was verified against preserved compressed ZIP bytes:
MASK counts contributing illuminated LROC inputs, BRES is best input
resolution in metres, and DIFF is SDEM minus reference LOLA DEM in metres.
Bands lack units tags, so units come from that README. The uncertainty file
is named GLDSIGM whereas the README calls GLD03 GLDISGM; that mapping is
inferred and explicitly flagged. No ancillary is a calibrated correctness
probability. Agreement of the prior LDEM with SL2 can be checked at this
point rather than assumed globally.

The synthetic control is permanently labeled SYNTHETIC AREA-AVERAGED 59.88 m
CONTROL. It is not a native NASA 60 m terrain product. Only the common SL2
footprint changes in the primary ladder; exterior 80/240 m terrain is fixed.
This excludes a claim of uniform pole-wide fidelity. Seam/cutoff witnesses
are recorded explicitly rather than replaced with zero elevation.
