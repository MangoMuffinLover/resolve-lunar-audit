# DE441 / cartographic-frame feasibility audit

The paper explicitly names DE441 when determining the midsummer dates, not
the exact kernel configuration of every QTS shadow run. The R-01A cartographic
terrain is in the documented DE421 Mean Earth realization. Keep that control
explicit; a filename change or generic MOON_ME alias is not a transformation.

Authoritative sources inspected:

- [Park et al. 2021, DE440/DE441](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/de440_and_de441.pdf):
  lunar orbit and orientation are fitted together; DE441 differs from DE440
  in lunar core/mantle damping, and is not an interchangeable label.
- [NAIF DE440 frame specification](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/fk/satellites/moon_de440_250416.tf):
  provides a specifically named DE440-to-ME421 cartographic realization using
  its associated DE440 binary orientation kernel. This does not establish an
  exact DE441 orientation/terrain transformation.
- [Official planetary kernel directory](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/):
  long-span DE441 trajectory files are multi-gigabyte partitions, not a small
  DE441s kernel. No matched DE441 orientation/ME421 chain has been validated
  in this workspace. No huge files are downloaded to conceal that missing
  validation, and DE440 is not substituted under the DE441 name.

**Result: exact controlled full-DE441 replication not run.** The blocker is
unvalidated matched orientation/cartographic reference and unknown QTS kernel
configuration, with a secondary disproportionate full-kernel acquisition
cost. A translational-only experiment in a deliberately fixed DE421 frame is
mathematically definable, but would not establish the requested full DE441
literature configuration and is not labeled as such here.

No empirical effect size is assigned to this factor. It cannot be called
negligible from the present experiment, and missing values are not zeros.
Future work could acquire an officially supported matched chain or validated
subset and register both fixed-orientation translation-only and matched-frame
comparisons separately. Primary R-01B geometry remains explicit DE421.
