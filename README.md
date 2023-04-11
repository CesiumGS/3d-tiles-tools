# 3D Tiles Tools

## Command line tools

#### Common command line options for each function:

|Flag|Description|Required|
|----|-----------|--------|
|`-i`, `--input`|Input file or directory| Yes|
|`-o`, `--output`|Output file or directory |Yes|
|`-f`, `--force`|Overwrite output if it exists|No, default `false`|

### Command line tools for tilesets

#### gzip

Gzips the input tileset. 
``` 
npx ts-node ./src/main.ts gzip -i ./specs/data/TilesetOfTilesets/ -o ./output/TilesetOfTilesets-gzipped/
```

Additional command line options:

|Flag|Description|Required|
|----|-----------|--------|
|`-t`, `--tilesOnly`|Only gzip tiles.|No, default `false`|

<sup>(Note: The exact set of files that are covered with `tilesOnly` is not specified yet)

#### ungzip

Ungzips the input tileset.
``` 
npx ts-node ./src/main.ts ungzip -i ./specs/data/TilesetOfTilesets-gzipped/ -o ./output/TilesetOfTilesets-ungzipped/
```

#### combine

Combines all external tilesets into a single tileset.json file.
```
npx ts-node ./src/main.ts combine -i ./specs/data/combineTilesets/input -o ./specs/data/combineTilesets/output
```

#### merge

Merge multiple tilesets into a single one that refers to the input tilesets as external tilesets.
```
npx ts-node ./src/main.ts merge -i ./specs/data/mergeTilesets/TilesetA -i ./specs/data/mergeTilesets/sub/TilesetA -o ./specs/data/mergeTilesets/output
```

#### upgrade

Upgrade a tileset to the latest 3D Tiles version.
```
npx ts-node ./src/main.ts upgrade -i ./specs/data/TilesetOfTilesets/tileset.json -o ./output/upgraded
```
The exact behavior of the upgrade operation is not yet specified. But when B3DM- and I3DM tile content in the input tileset uses glTF 1.0 assets, then the upgrade step will try to upgrade these assets to glTF 2.0.

#### convert

<sup>(This replaces the `databaseToTileset` and `tilesetToDatabase` commands)</sup>

Convert between tilesets and tileset package formats. 
```
npx ts-node ./src/main.ts upgrade -i ./specs/data/TilesetOfTilesets/tileset.json -o ./output/TilesetOfTilesets.3tz
```

The input- and output arguments for this command may be

- The name of a directory that contains a `tileset.json` file (or the full path to a tileset JSON file)
- The name of a `.3tz` file
- The name of a `.3dtiles` file

The input may also be a `.zip` file that contains a `tileset.json` file.

#### databaseToTileset

Deprecated. This functionality is now offered via the `convert` command.

#### tilesetToDatabase

Deprecated. This functionality is now offered via the `convert` command.



### Command line tools for tile content

#### glbToB3dm

Creates a b3dm from a glb with an empty batch table.
```
npx ts-node ./src/main.ts glbToB3dm -i ./specs/data/CesiumTexturedBox/CesiumTexturedBox.glb -o ./output/CesiumTexturedBox.b3dm
```

#### glbToI3dm

Creates a i3dm from a glb with a single instance at position `[0, 0, 0]` and an empty batch table. 
```
npx ts-node ./src/main.ts glbToI3dm -i ./specs/data/CesiumTexturedBox/CesiumTexturedBox.glb -o ./output/CesiumTexturedBox.i3dm
```

#### b3dmToGlb

Extracts the glb from a b3dm. 
```
npx ts-node ./src/main.ts b3dmToGlb -i ./specs/data/batchedWithBatchTableBinary.b3dm -o ./output/extracted.glb
```

#### i3dmToGlb

Extracts the glb from a i3dm. 

```
npx ts-node ./src/main.ts b3dmToGlb -i ./specs/data/instancedWithBatchTableBinary.i3dm -o ./output/extracted.glb
```

#### cmptToGlb

Extracts the glb models from a cmpt tile. If multiple models are found a number will be appended to the output file name.

```
npx ts-node ./src/main.ts b3dmToGlb -i ./specs/data/composite.cmpt -o ./output/extracted.glb
```

#### optimizeB3dm

Optimize a b3dm using [gltf-pipeline](https://github.com/CesiumGS/gltf-pipeline/blob/main/README.md). 

```
npx ts-node ./src/main.ts optimizeB3dm -i ./specs/data/batchedWithBatchTableBinary.b3dm -o ./output/optimized.b3dm
```

Additional command line options:

| Flag | Description | Required |
| ---- | ----------- | -------- |
|`--options`|All arguments past this flag are consumed by gltf-pipeline.| No |

**Examples**: 

Quantize floating-point attributes and oct-encode normals:
```
npx ts-node ./src/main.ts optimizeB3dm -i ./specs/data/batchedWithBatchTableBinary.b3dm -o ./output/optimized.b3dm --options -q -n
```

To use Draco compression, pass the [`draco` flags](https://github.com/CesiumGS/gltf-pipeline/blob/main/README.md#command-line-flags)
```
npx ts-node ./src/main.ts optimizeB3dm -i ./specs/data/Textured/batchedTextured.b3dm -o ./output/optimized.b3dm --options --draco.compressMeshes --draco.compressionLevel=9
```
This example optimizes the b3dm and compresses the meshes using Draco, with a high compression level.


#### optimizeI3dm

Optimize a i3dm using [gltf-pipeline](https://github.com/CesiumGS/gltf-pipeline/blob/main/README.md).
```
npx ts-node ./src/main.ts optimizeI3dm -i ./specs/data/instancedWithBatchTableBinary.i3dm -o ./output/optimized.i3dm
```
See [optimizeB3dm](#optimizeb3dm) for further examples.


### Pipeline 

Execute a sequence of operations that are described in a JSON file.

> **Note:** The pipeline execution feature is preliminary. Many aspects of the pipeline definition, including the JSON representation and the exact set of operations that are supported as parts of pipelines may change in future releases.

 The basic structure of a pipeline JSON file is summarized here:

- A pipeline has an `input` and `output`, which are the names of a tileset directory or package
- A pipeline has an array of 'tileset stages'
- A tileset stage has a `name` and a `description`
- A tileset stage has an array of 'content stages'
- A content stage has a `name` and a `description`
- A content stage can carry information about the content types that it is applied to

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

- `upgrade`: Upgrade the input tileset to the latest version. Details about what that means are omitted here.
- `combine`: Combine all external tilesets of the input tileset, to create a single tileset

The known content stages are:

- Compression:
  - `gzip`: Apply GZIP compression to all files (with optional filters)
  - `ungzip`: Uncompress all files that are compressed with GZIP
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



---

## Demos

The `demos` folder contains some examples of how the functionality of the tools may be used as a library. This is intended as a preview. The functionality is not yet exposed as a public API.

### General tool functions

Basic functions for reading tile data:
```
npx ts-node ./demos/TileFormatsDemoBasic.ts
```

Basic functions for converting tile data:
```
npx ts-node ./demos/TileFormatsDemoConversions.ts
```

Demos for content data type detection:
```
npx ts-node ./demos/ContentDataTypeRegistryDemo.ts
```

Demos for tileset processing (upgrade, combine, merge)
```
npx ts-node ./demos/TilesetProcessingDemos.ts
```

### Archive/Package functions 

Basic examples of creating and reading packages:
```
npx ts-node ./demos/PackagesDemo.ts
```

Package conversion:
```
npx ts-node ./demos/PackageConversion.ts -i ./specs/data/Tileset -o ./output/example.3tz
```
(Input may be 3TZ, 3DTILES, ZIP, or directory. Output may be 3TZ, 3DTILES, or directory)

**Very** simple draft of a package server:
```
npx ts-node ./demos/PackageServer.ts -s ./specs/data/Tileset
```
to be opened with the `PackageSandcastle.js`.

---

Basic benchmark for creating 3DTILES/3TZ packages with artifical data:
```
npx ts-node ./demos/benchmarks/PackageCreationBenchmark.ts
```

Basic benchmark for reading the 3DTILES/3TZ that have been created with the previous benchmark:
```
npx ts-node ./demos/benchmarks/PackageReadingBenchmark.ts
```



