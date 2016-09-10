Command line utilities for processing and converting 3D Tiles tilesets.

# Generate B3dm from Glb

Creates a b3dm from a glb with an empty batch table.

## Example
`node ./bin/generateB3dmFromGlb -i someGlb.glb -o someB3dm.b3dm`

## Command-Line Flags
| Flag | Description | Required |
| ---- | ----------- | -------- |
|`-i` | Input path of the `.glb`| yes |
|`-o` | Output path of the resulting `.b3dm` | no, defaults to the same as the input path, but with `.b3dm` instead of the pre-existing 3-character extension (typically `glb`)
