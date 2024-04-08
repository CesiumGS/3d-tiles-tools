A test for the `combine` functionality involving external tilesets
that have a root transform that is not identity.

A regression test for https://github.com/CesiumGS/3d-tiles-tools/issues/112

Each external tileset refers to a unit cube (0,0,0)-(1,1,1).

The `externalR` refers to a red cube and has a translation of 3 in x-direction.
The `externalG` refers to a green cube and has a translation of 4 in y-direction.
The `externalB` refers to a blue cube and has a translation of 5 in z-direction.
