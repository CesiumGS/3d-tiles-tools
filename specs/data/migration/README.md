
Data for testing the migration of legacy tile formats to glTF.

The tilesets in the `input` directory are copies of the corresponding files in the CesiumJS specs, at
https://github.com/CesiumGS/cesium/tree/08f28d46a5201ff49c211bc2bcbc6f254b275391/Specs/Data/Cesium3DTiles
(Exceptions listed below)

The `TileFormatsMigrationSpec.ts` tests are processing these inputs:

- Calling `Tilesets.upgrade` for each of them, writing the corresponding output to the `output` directory
- Extracting the JSON part of the GLB files in the output directories, and writing them to `output_gltf`
- Comparing these JSON parts to the data that is stored in the `golden_gltf` directory

When there are any changes (differences) compared to the "golden" output, then they should be
reviewed, and, if confirmed to be correct, be moved to the "golden" directory and committed.

A sandcastle for visually inspecting the inputs/outputs is added in `TileFormatsMigrationTestSandcastle.js`.

When serving **this** directory (i.e. the `./specs/data/migration/` directory) with a server,
then this sandcastle allows selecing the different test cases and compare the input/output.

---

Inputs that are not part of the CesiumJS spec files are the following:

The inputs in the `InstancedAxes`directory:

They all consist of I3DMs with a simple GLB with labeled coordinate axes, occupying 
exactly the unit cube. This coordinate axes GLB asset is CC0 (public domain).

- `InstancedAxesSimple`: Instanced at the corners of a cube (0,0,0)-(2,2,2).
- `InstancedAxesRotated`: The instance at (x,y,z) is rotated around the axis along (x,y,z), by 22.5 degrees
- `InstancedAxesRotated`: The instance at (x,y,z) is scaled by 1.5 for each non-zero component of (x,y,z)

The inputs in the `BatchedLegacy` directory:

- `BatchedWithGltf1With2DNormals`: A B3DM that contains a glTF 1.0 asset that uses oct-encoded VEC2/BYTE normals. These had originally been decoded in the shader that was part of the glTF asset itself. Now, they are decoded into 3D normals during the `upgrade`. See https://github.com/CesiumGS/3d-tiles-tools/issues/97

