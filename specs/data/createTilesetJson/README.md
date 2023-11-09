
Data for testing the `createTilesetJson` command.

The tile content files in the `input` directory are copies of the corresponding files in the CesiumJS specs, 
at https://github.com/CesiumGS/cesium/tree/08f28d46a5201ff49c211bc2bcbc6f254b275391/Specs/Data/Cesium3DTiles
(except for `plane-ds-p-n-32x32.glb`, which is simple "diamond-square" plane in the xy-plane)

The `TilesetJsonCreatorSpec.ts` tests are processing these inputs:

- Calling the `TilesetJsonCreator` for each of them, writing resulting tilesets (and the input files) to the `output` directory
- Comparing these tileset JSON files to the data that is stored in the `golden` directory

When there are any changes (differences) compared to the "golden" output, then they should be
reviewed, and, if confirmed to be correct, be moved to the "golden" directory and committed.

A sandcastle for visually inspecting the outputs is added in `CreateTilesetJsonTestSandcastle.js`.
When serving the output directory (i.e. the `./specs/data/createTilesetJson/output` directory) with a server,
then this sandcastle allows selecting the different test cases.

