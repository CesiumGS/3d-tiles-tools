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
npx ts-node ./src/main.ts merge -i ./specs/data/mergeTilesets/input/TilesetA -i ./specs/data/mergeTilesets/input/sub/TilesetA -o ./specs/data/mergeTilesets/output
```


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

To use tileset texture compression, pass the [`texcomp` flags](https://github.com/CesiumGS/gltf-pipeline/blob/main/README.md#command-line-flags)
```
node ./bin/3d-tiles-tools.js optimizeB3dm -i ./specs/data/Textured/batchedTextured.b3dm -o ./output/optimized.b3dm --options --texcomp.dxt1.enable --texcomp.dxt1.quality=5 --texcomp.etc1.enable
```
This example optimizes the b3dm and compresses the textures into `dxt1` and `etc1` formats.


### optimizeI3dm

Optimize a i3dm using [gltf-pipeline](https://github.com/CesiumGS/gltf-pipeline/blob/main/README.md).
```
node ./bin/3d-tiles-tools.js optimizeI3dm -i ./specs/data/instancedWithBatchTableBinary.i3dm -o ./output/optimized.i3dm
```
See [optimizeB3dm](#optimizeb3dm) for further examples.


---

**Draft** demos for the library usage:

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



