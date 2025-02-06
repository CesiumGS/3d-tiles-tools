
Data for testing the `upgrade` command.

When running the `TilesetUpgraderGeneralSpec` (and not deleting the "output" 
directory), then the upgraded tilesets will be available in the `output` 
subdirectory. 

A sandcastle for visually inspecting the results is added in 
`TilesetUpgraderGeneralSandcastle.js`. When serving this directory (i.e. 
the `./specs/data/upgradeTileset/general` directory) with a server, 
then this sandcastle allows selecting the different inputs and outputs.
