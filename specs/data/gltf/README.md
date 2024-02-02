glTF assets for tests of the 'GltfTransform' and 'GltfUtilities' classes.

The "Box..." models are for testing the functionality
of reading GLB data with compression extensions, using
the 'GltfTransform' class:

- Box.glb is the model from https://github.com/KhronosGroup/glTF-Sample-Models/blob/4ca06672ce15d6a27bfb5cf14459bc52fd9044d1/2.0/Box/
- BoxDraco.glb is the same model with Draco compression
- BoxMeshopt.glb is the same model with meshopt compression

The "glTF...With..." models are for testing the functionality
of extracting the JSON- and binary data from GLB files, using
the 'GltfUtilities' class, involving some corner cases:

- glTF1GlbWith5BytesBin.glb Is a glTF 1.0 binary file, with a body that contains the bytes [0,1,2,3,4]
- glTF1GlbWithoutBin.glb Is a glTF 1.0 binary file, with an empty binary body
- glTF2GlbWith5BytesBin.glb Is a glTF 2.0 binary file, with a body that contains the bytes [0,1,2,3,4], padded with 3 zero bytes
- glTF2GlbWithoutBin.glb Is a glTF 2.0 binary file, with an empty binary body

(The last one is a test for https://github.com/CesiumGS/3d-tiles-tools/issues/89)

