
Data for testing the handling of the `gltfUpAxis` in the `upgrade` command.

Pre-1.0 tilesets could specify an `asset.gltfUpAxis` to be `X`, `Y`, or `Z`, to denote
the axis that should be considered to be the up-axis in the glTF 1.0 data that was
contained in B3DM or I3DM.

During the `upgrade` command, when the `--targetVersion 1.1` was specified, the
glTF from the B3DM and I3DM are extracted and converted into standard glTF 2.0.
This conversion has to take into account the possible `gltfUpAxis` values.

The tilesets in the `input` directory have been carefully crafted to contain B3DM-
and I3DM data with glTF 1.0, with different up-axis conventions. When running
the `TilesetUpgraderAxesSpec` (and not deleting the "output" directory), then
the upgraded tilesets will be available in the `output` subdirectory. 

A sandcastle for visually inspecting the results is added in `UpAxisHandlingSandcastle.js`.
When serving this directory (i.e. the `./specs/data/upgradeTileset/upAxisHandling` directory) 
with a server, then this sandcastle allows selecting the different inputs and outputs.
