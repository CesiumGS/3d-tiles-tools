# 3D Tiles Tools

## Overview

The 3D Tiles Tools are a collection of tools and utilities for converting, optimizing, processing, and analyzing 3D Tiles data.

## Installation

To install the 3D Tiles Tools locally into a directory, run
```
npm install 3d-tiles-tools
```
If you want to work directly with a clone of the Git repository, see [Developer Setup](#developer-setup).

## Command Line Usage

> **Note:** All input- and output paths for the 3D Tiles Tools are _case sensitive_. Even though some operating systems (like Windows) usually do not differentiate between uppercase and lowercase, the file- and directory names that are given at the command line must exactly match the actual names.

#### Common command line options for each function:

|Flag|Description|Required|
|----|-----------|--------|
|`-i`, `--input`|Input file or directory| Yes|
|`-o`, `--output`|Output file or directory |Yes|
|`-f`, `--force`|Overwrite output if it exists|No, default `false`|
|`--logLevel`|The log level. Valid values are `trace`, `debug`, `info`, `warn`, `error`, `fatal`, and `silent` |No, default `info`|
|`--logJson`|Print log messages as JSON instead of pretty-printed|No, default `false`|


### Command line tools for tilesets

#### gzip

Gzips the input tileset. 
``` 
npx 3d-tiles-tools gzip -i ./specs/data/TilesetOfTilesets/ -o ./output/TilesetOfTilesets-gzipped/
```

Additional command line options:

|Flag|Description|Required|
|----|-----------|--------|
|`-t`, `--tilesOnly`|Only gzip tiles.|No, default `false`|

<sup>(Note: The exact set of files that are covered with `tilesOnly` is not specified yet)

#### ungzip

Ungzips the input tileset.
``` 
npx 3d-tiles-tools ungzip -i ./specs/data/TilesetOfTilesets-gzipped/ -o ./output/TilesetOfTilesets-ungzipped/
```

#### combine

Combines all external tilesets into a single tileset.

> **Note** about the difference between `merge` and `combine`: The `combine` command takes a tileset that already _refers_ to _external_ tilesets. And it creates a new tileset where the former _external_ tilesets are "inlined". So the result will be a single tileset, without external references.

Example:

```
npx 3d-tiles-tools combine -i ./specs/data/combineTilesets/input -o ./specs/data/combineTilesets/output
```

#### merge

Merge multiple tilesets into a single one that refers to the input tilesets as external tilesets.

> **Note** about the difference between `merge` and `combine`: The `merge` command creates a _new_ tileset that _refers_ to the given ones as _external_ tilsets. This means that the resulting tileset is not complete _without_ the ones that are used as the inputs for the `merge` command.

Example:
```
npx 3d-tiles-tools merge -i ./specs/data/mergeTilesets/TilesetA -i ./specs/data/mergeTilesets/sub/TilesetA -o ./specs/data/mergeTilesets/output
```

#### mergeJson

Merge multiple tilesets into a single tileset JSON file that refers to the input tilesets as external tilesets. 

This differs from the `merge` command insofar that it does not copy the input tilesets to the output directory, but only creates the JSON file for the merged tileset, which uses relative paths to refer to the input tilesets. A common use case for this is to create a tileset JSON file in a certain directory, with the input tilesets being located in subdirectories.

Example:
```
npx 3d-tiles-tools mergeJson -i ./example/TilesetA/tileset.json -i ./example/TilesetB/tileset.json -o ./example/mergedTileset.json
```

#### upgrade

Upgrade a tileset to the latest 3D Tiles version.
```
npx 3d-tiles-tools upgrade -i ./specs/data/TilesetOfTilesets/tileset.json -o ./output/upgraded
```

Additional command line options:

| Flag | Description | Required |
| ---- | ----------- | -------- |
|`--targetVersion`|The target version to upgrade to. May be `1.0` or `1.1`.| No. Default: `1.0` |
|`--options`|All arguments past this flag are consumed by gltf-pipeline.| No |

By default, this will upgrade legacy tilesets to comply to the 3D Tiles 1.0 specification.

These upgrades include:

- The asset version will be set to `'1.0'`.
- Tile content that uses a `url` will be upgraded to use `uri`.
- The `refine` value will be converted to be in all-uppercase.
- glTF 1.0 models in B3DM or I3DM will be upgraded to glTF 2.0.

> Implementation note:
> 
> Internally, the conversion of glTF 1.0 assets into glTF 2.0 assets is performed by processing the GLB data with [`gltf-pipeline`](https://github.com/CesiumGS/gltf-pipeline/). This will include the attempt to convert materials that are given with the `KHR_technique_webgl` extension into PBR materials. Options that are given after the `--options` parameter are passed to `gltf-pipeline`. These options may include the names of uniform variables that should indicate whether a certain texture is used as the "base color" texture of a PRB material. For example, when a tileset contains B3DM or I3DM data that contains GLB with the `KHR_technique_webgl` extension where the uniform names `u_diff_tex` and `u_diffuse` indicate that a texture should be a base color texture, then the command line
> ```
> npx 3d-tiles-tools upgrade -i ./input/tileset.json -o ./output/tileset.json --options --baseColorTextureNames u_diff_tex --baseColorTextureNames u_diffuse
> ```
> can be used.

When `--targetVersion 1.1` is given, then this will upgrade legacy tilesets to comply to the 3D Tiles 1.1 specification, _including_ an attempt to convert PNTS, B3DM, and I3DM tile content into glTF assets. The upgrades then include:

- The asset version will be set to `'1.1'`.
- Tile content that uses a `url` will be upgraded to use `uri`.
- The `refine` value will be converted to be in all-uppercase.
- glTF 1.0 models in B3DM or I3DM will be upgraded to glTF 2.0.
- The `3DTILES_content_gltf` extension declaration will be removed.
- PNTS, B3DM, I3DM, and CMPT content will be converted to glTF.

> Implementation note:
> 
> The conversion of the legacy tile formats to glTF should be considered as a _preview feature_. There are corner cases where the conversion is not possible generically - for example, when I3DM tile content contains glTF data that contains _animations_, or when a CMPT (indirectly) contains multiple glTF assets that already use the `EXT_structural_metadata` extension. The conditions under which the conversion is possible may be specified more explicitly in the future. 




#### convert

<sup>(This replaces the `databaseToTileset` and `tilesetToDatabase` commands)</sup>

Convert between tilesets and tileset package formats. 
```
npx 3d-tiles-tools convert -i ./specs/data/TilesetOfTilesets/tileset.json -o ./output/TilesetOfTilesets.3tz
```

Additional command line options:

| Flag | Description | Required |
| ---- | ----------- | -------- |
|`--inputTilesetJsonFileName`|The name of the input file that should be considered to be the top-level tileset JSON file| No |

The input- and output arguments for this command may be

- The name of a directory that contains a `tileset.json` file (or the full path to a tileset JSON file)
- The name of a `.3tz` file
- The name of a `.3dtiles` file

The input may also be a `.zip` file that contains a `tileset.json` file.

When the input is a `.zip` file or a directory that contains multiple tileset JSON files, and none of them is called `tileset.json`, then the `--inputTilesetJsonFileName` argument can be used to define the JSON file that should be considered to be the top-level tileset JSON. For example, when there is an `ambiguous.zip` tile that does contain two JSON files called `tilesetA.json` and `tilesetB.json`, the following command can be used to designate `tilesetA.json` as the top-level tileset JSON file:
```
npx 3d-tiles-tools convert -i ./specs/data/convert/ambiguous.zip -o ./output/ambiguous.3tz --inputTilesetJsonFileName tilesetA.json
```

#### databaseToTileset

Deprecated. This functionality is now offered via the `convert` command.

#### tilesetToDatabase

Deprecated. This functionality is now offered via the `convert` command.



### Command line tools for tile content

#### glbToB3dm

Creates a b3dm from a glb with an empty batch table.
```
npx 3d-tiles-tools glbToB3dm -i ./specs/data/CesiumTexturedBox/CesiumTexturedBox.glb -o ./output/CesiumTexturedBox.b3dm
```

#### glbToI3dm

Creates a i3dm from a glb with a single instance at position `[0, 0, 0]` and an empty batch table. 
```
npx 3d-tiles-tools glbToI3dm -i ./specs/data/CesiumTexturedBox/CesiumTexturedBox.glb -o ./output/CesiumTexturedBox.i3dm
```

#### b3dmToGlb

Extracts the glb from a b3dm. 
```
npx 3d-tiles-tools b3dmToGlb -i ./specs/data/batchedWithBatchTableBinary.b3dm -o ./output/extracted.glb
```

#### i3dmToGlb

Extracts the glb from a i3dm. 

```
npx 3d-tiles-tools i3dmToGlb -i ./specs/data/instancedWithBatchTableBinary.i3dm -o ./output/extracted.glb
```

#### cmptToGlb

Extracts the glb models from a cmpt tile. If multiple models are found a number will be appended to the output file name.

```
npx 3d-tiles-tools cmptToGlb -i ./specs/data/composite.cmpt -o ./output/extracted.glb
```

#### splitCmpt

Split a cmpt tile into its inner tiles. The output file name for each inner tile will be determined by appending a number to the given output file name, and an extension that depends on the type of the inner tile data.

```
npx 3d-tiles-tools splitCmpt -i ./specs/data/compositeOfComposite.cmpt -o ./output/inner --recursive
```

For an input file `compositeOfComposite.cmpt` that contains a composite tile that contains one B3DM and one I3DM content, this will generate the files `inner_0.b3dm` and `inner_1.i3dm` in the output directory.

Additional command line options:

| Flag | Description | Required |
| ---- | ----------- | -------- |
|`--recursive`|Whether the split operation should be applied to inner tiles that are composite| No, default: `false` |


#### convertB3dmToGlb

Convert a b3dm file into a glTF asset that uses glTF extensions to represent the batch- and feature table information.

```
npx 3d-tiles-tools convertB3dmToGlb -i ./data/example.b3dm -o ./data/example.glb
```

#### convertPntsToGlb

Convert a pnts file into a glTF asset that uses glTF extensions to represent the point properties and batch- and feature table information.

```
npx 3d-tiles-tools convertPntsToGlb -i ./data/example.pnts -o ./data/example.glb
```

#### convertI3dmToGlb

Convert an i3dm file into a glTF asset that uses glTF extensions to represent the batch- and feature table information. This conversion may be lossy if the GLB of the input i3dm contains animations.

```
npx 3d-tiles-tools convertI3dmToGlb -i ./data/example.i3dm -o ./data/example.glb
```


#### optimizeB3dm

Optimize a b3dm using [gltf-pipeline](https://github.com/CesiumGS/gltf-pipeline/blob/main/README.md). 

```
npx 3d-tiles-tools optimizeB3dm -i ./specs/data/batchedWithBatchTableBinary.b3dm -o ./output/optimized.b3dm
```

Additional command line options:

| Flag | Description | Required |
| ---- | ----------- | -------- |
|`--options`|All arguments past this flag are consumed by gltf-pipeline.| No |

**Examples**: 

To use Draco compression, pass the [`draco` flags](https://github.com/CesiumGS/gltf-pipeline/blob/main/README.md#command-line-flags)
```
npx 3d-tiles-tools optimizeB3dm -i ./specs/data/Textured/batchedTextured.b3dm -o ./output/optimized.b3dm --options --draco.compressMeshes --draco.compressionLevel=9
```
This example optimizes the b3dm and compresses the meshes using Draco, with a high compression level.


#### optimizeI3dm

Optimize an i3dm using [gltf-pipeline](https://github.com/CesiumGS/gltf-pipeline/blob/main/README.md).
```
npx 3d-tiles-tools optimizeI3dm -i ./specs/data/instancedWithBatchTableBinary.i3dm -o ./output/optimized.i3dm
```
See [optimizeB3dm](#optimizeb3dm) for further examples.


#### updateAlignment

Update a B3DM, I3DM, PNTS or CMPT file to ensure that the alignment requirements
for the batch- and feature tables and the tile data as a whole are met. For CMPT
tile data, the data of inner tiles will be updated recursively.

```
npx 3d-tiles-tools updateAlignment -i ./specs/data/updateAlignment/testComposite.cmpt -o ./output/testCompositeFixed.cmpt
```


#### analyze

Analyze the input file, and write the results to the output directory.
```
npx 3d-tiles-tools analyze -i ./specs/data/batchedWithBatchTableBinary.b3dm -o ./output/analyzed/
```
This will accept B3DM, I3DM, PNTS, CMPT, and GLB files (both for glTF 1.0 and for glTF 2.0), and write files into the output directory that contain the feature table, batch table, layout information, the GLB, and the JSON of the GLB. This is primarily intended for debugging and analyzing tile data. Therefore, the exact naming and content of the generated output files are not specified.


#### createTilesetJson

Create a tileset JSON file from a given set of tile content files.

Additional command line options:

| Flag | Description | Required |
| ---- | ----------- | -------- |
|`--cartographicPositionDegrees`|An array of either two or three values, which are the (longitude, latitude) or (longitude, latitude, height) of the target position. The longitude and latitude are given in degrees, and the height is given in meters.| No |

If the input is a single file, then this will result in a single (root) tile with the input file as its tile content. If the input is a directory, then all content files in this directory will be used as tile content, recursively. The exact set of file types that are considered to be 'tile content' is not specified, but it will include GLB, B3DM, PNTS, I3DM, and CMPT files.

Examples:

```
npx 3d-tiles-tools createTilesetJson -i ./input/ -o ./output/tileset.json --cartographicPositionDegrees -75.152 39.94 10
```
This creates the specified tileset JSON file, which will refer to all tile content files in the given input directory as its tile contents. The root node of the tileset will have a transform that will place it at the given cartographic position.



### Pipeline 

Execute a sequence of operations that are described in a JSON file.

> **Note:** The pipeline execution feature is preliminary. Many aspects of the pipeline definition, including the JSON representation and the exact set of operations that are supported as parts of pipelines may change in future releases.

 The basic structure of a pipeline JSON file is summarized here:

- A pipeline has an `input` and `output`, which are the names of a tileset directory or package
- A pipeline has an array of 'tileset stages'
- A tileset stage has a `name` and a `description`
- A tileset stage can carry information about the content types that it is applied to
- A tileset stage has an array of 'content stages'
- A content stage has a `name` and a `description`

A simple example pipline may therefore look like this:
```
{
  "input": "./specs/data/TilesetOfTilesetsWithUris",
  "output": "./output/TilesetOfTilesetsWithUris.3tz",
  "tilesetStages": [
    {
      "name": "_b3dmToGlb",
      "description": "Convert B3DM to GLB",
      "contentStages": [
        {
          "name": "b3dmToGlb",
          "description": "Convert each B3DM content into GLB"
        }
      ]
    }
  ]
}
```

The `name` of a tileset- or content stage can refer to a predefined set of operations that can be executed. If a `name` is not one of the known operations, it should start with an `_` underscore. 

The `description` of a tileset- or content stage is intended as a human-readable summary, to be shown as log output.

The predefined operations largely correspond to the command-line functionality. 

The known tileset stages are:

- Modification:
  - `upgrade`: Upgrade the input tileset to the latest version. Details about what that means are omitted here.
  - `combine`: Combine all external tilesets of the input tileset, to create a single tileset
- Compression:
  - `gzip`: Apply GZIP compression to all files (with optional filters)
  - `ungzip`: Uncompress all files that are compressed with GZIP

The known content stages are:

- Conversion:
  - `glbToB3dm`: Convert all GLB tile contents into B3DM
  - `glbToI3dm`: Convert all GLB tile contents into I3DM (with the GLB being the only instance)
  - `b3dmToGlb`: Convert all B3DM tile contents into GLB (assuming that the B3DM is only a wrapper around GLB)
  - `i3dmToGlb`: Convert all I3DM tile contents into GLB (assuming that the I3DM is only a wrapper around GLB)
  - `separateGltf`: Convert all GLB tile contents into `.gltf` files with external resources
- Optimization:

  These operations receive an `options` object, which is an untyped object carrying the options that are passed to `gltf-pipeline` for the optimization.
  - `optimizeGlb`: Optimize GLB tile content, using `gltf-pipeline`
  - `optimizeB3dm`: Optimize the GLB payload of a B3DM tile content, using `gltf-pipeline`
  - `optimizeI3dm`: Optimize the GLB payload of a I3DM tile content, using `gltf-pipeline`
  
An example of a pipeline that combines a sequence of multiple operations is shown in [`examplePipeline.json`](./specs/data/pipelines/examplePipeline.json).


## Developer Setup

When the tools are not installed as a package from NPM, but supposed to be used directly in a cloned repository, then the command line usage is as follows:

- Clone the repository into the current directory:
  ```
  git clone https://github.com/CesiumGS/3d-tiles-tools
  ```
- Change into the directory of the cloned repository:
  ```
  cd 3d-tiles-tools
  ```
- Install the tools and all dependencies:
  ```
  npm install
  ```

After this, the tools can be executed using the same command line options as described above - for example:
```
npx ts-node .\src\cli\main.ts gzip -i ./specs/data/TilesetOfTilesets/ -o ./output/TilesetOfTilesets-gzipped/
```

See the [implementation notes](IMPLEMENTATION.md) for details about the project structure.

