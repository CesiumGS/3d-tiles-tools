# 3D Tiles Tools

Node.js library and command-line tools for processing and converting 3D Tiles tilesets.

## Instructions

Clone this repo and install [Node.js](http://nodejs.org/).  From the root directory of this repo, run:
```
npm install
```

## Command line tools

### gzip

Gzips the input tileset.

```
node ./bin/3d-tiles-tools.js gzip ./specs/data/TilesetOfTilesets/ ./output/TilesetOfTilesets-gzipped/
```
```
node ./bin/3d-tiles-tools.js gzip -i ./specs/data/TilesetOfTilesets/ -o ./output/TilesetOfTilesets-gzipped/
```

|Flag|Description|Required|
|----|-----------|--------|
|`-i`, `--input`|Input directory of the tileset.| :white_check_mark: Yes|
|`-o`, `--output`|Output directory of the processed tileset.|No|
|`-t`, `--tilesOnly`|Only gzip tiles.|No, default `false`|
|`-f`, `--force`|Overwrite output directory if it exists.|No, default `false`|

### ungzip

Ungzips the input tileset.

```
node ./bin/3d-tiles-tools.js ungzip ./specs/data/TilesetOfTilesets/ ./output/TilesetOfTilesets-ungzipped/
```
```
node ./bin/3d-tiles-tools.js ungzip -i ./specs/data/TilesetOfTilesets/ -o ./output/TilesetOfTilesets-ungzipped/
```

|Flag|Description|Required|
|----|-----------|--------|
|`-i`, `--input`|Input directory of the tileset.| :white_check_mark: Yes|
|`-o`, `--output`|Output directory of the processed tileset.|No|
|`-f`, `--force`|Overwrite output directory if it exists.|No, default `false`|

### combine

Combines all external tilesets into a single tileset.json file.

```
node ./bin/3d-tiles-tools.js combine ./specs/data/TilesetOfTilesets/ ./output/TilesetOfTilesets-combined/
```
```
node ./bin/3d-tiles-tools.js combine -i ./specs/data/TilesetOfTilesets/ -o ./output/TilesetOfTilesets-combined/
```

|Flag|Description|Required|
|----|-----------|--------|
|`-i`, `--input`|Input directory of the tileset.| :white_check_mark: Yes|
|`-o`, `--output`|Output directory of the processed tileset.|No|
|`-r`, `--rootJson`|Relative path to the root tileset.json file.|No, default `tileset.json`|
|`-f`, `--force`|Overwrite output file if it exists.| No, default `false` |

### upgrade

Upgrades the input tileset to the latest version of the 3D Tiles spec. Embedded glTF models will be upgraded to glTF 2.0.

```
node ./bin/3d-tiles-tools.js upgrade ./specs/data/TilesetOfTilesets/ ./output/TilesetOfTilesets-upgraded/
```
```
node ./bin/3d-tiles-tools.js upgrade -i ./specs/data/TilesetOfTilesets/ -o ./output/TilesetOfTilesets-upgraded/
```

|Flag|Description|Required|
|----|-----------|--------|
|`-i`, `--input`|Input directory of the tileset.| :white_check_mark: Yes|
|`-o`, `--output`|Output directory of the processed tileset.|No|
|`-f`, `--force`|Overwrite output file if it exists.| No, default `false` |

### glbToB3dm

Creates a b3dm from a glb with an empty batch table. Since this tool does not
process an entire tileset, it cannot be used with the Pipeline tool.

```
node ./bin/3d-tiles-tools.js glbToB3dm ./specs/data/CesiumTexturedBox/CesiumTexturedBox.glb ./output/CesiumTexturedBox.b3dm
```
```
node ./bin/3d-tiles-tools.js glbToB3dm -i ./specs/data/CesiumTexturedBox/CesiumTexturedBox.glb -o ./output/CesiumTexturedBox.b3dm
```

| Flag | Description | Required |
| ---- | ----------- | -------- |
|`-i`, `--input`| Input path of the `.glb`| :white_check_mark: Yes |
|`-o`, `--output`| Output path of the resulting `.b3dm` | No |
|`-f`, `--force`|Overwrite output file if it exists.| No, default `false` |

### glbToI3dm

Creates a i3dm from a glb with a single instance at position `[0, 0, 0]` and an empty batch table. Since this tool does not
process an entire tileset, it cannot be used with the Pipeline tool.

```
node ./bin/3d-tiles-tools.js glbToI3dm ./specs/data/CesiumTexturedBox/CesiumTexturedBox.glb ./output/CesiumTexturedBox.i3dm
```
```
node ./bin/3d-tiles-tools.js glbToI3dm -i ./specs/data/CesiumTexturedBox/CesiumTexturedBox.glb -o ./output/CesiumTexturedBox.i3dm
```

| Flag | Description | Required |
| ---- | ----------- | -------- |
|`-i`, `--input`| Input path of the `.glb`| :white_check_mark: Yes |
|`-o`, `--output`| Output path of the resulting `.i3dm` | No |
|`-f`, `--force`|Overwrite output file if it exists.| No, default `false` |

### b3dmToGlb

Creates a glb from a b3dm. Since this tool does not process an entire tileset,
it cannot be used with the Pipeline tool.

```
node ./bin/3d-tiles-tools.js b3dmToGlb -i ./specs/data/batchedWithBatchTableBinary.b3dm -o ./output/extracted.glb
```

| Flag | Description | Required |
| ---- | ----------- | -------- |
|`-i`, `--input`| Input path of the `.b3dm`| :white_check_mark: Yes |
|`-o`, `--output`| Output path of the resulting `.glb` | No |
|`-f`, `--force`|Overwrite output file if it exists.| No, default `false` |

### i3dmToGlb

Creates a glb from a i3dm. Since this tool does not process an entire tileset,
it cannot be used with the Pipeline tool.

```
node ./bin/3d-tiles-tools.js i3dmToGlb -i ./specs/data/instancedWithBatchTableBinary.i3dm -o ./output/extracted.glb
```

| Flag | Description | Required |
| ---- | ----------- | -------- |
|`-i`, `--input`| Input path of the `.i3dm`| :white_check_mark: Yes |
|`-o`, `--output`| Output path of the resulting `.glb` | No |
|`-f`, `--force`|Overwrite output file if it exists.| No, default `false` |

### cmptToGlb

Extracts the glb models from a cmpt tile. If multiple models are found a number will be appended to the
output file name. Since this tool does not process an entire tileset, it cannot be used with the Pipeline tool.

```
node ./bin/3d-tiles-tools.js cmptToGlb -i ./specs/data/composite.cmpt -o ./output/extracted.glb
```

| Flag | Description | Required |
| ---- | ----------- | -------- |
|`-i`, `--input`| Input path of the `.cmpt`| :white_check_mark: Yes |
|`-o`, `--output`| Output path of the resulting `.glb` | No |
|`-f`, `--force`|Overwrite output file if it exists.| No, default `false` |

### optimizeB3dm

Optimize a b3dm using [gltf-pipeline](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/blob/master/README.md). Since this tool does not
process an entire tileset, it cannot be used with the Pipeline tool.

```
node ./bin/3d-tiles-tools.js optimizeB3dm -i ./specs/data/batchedWithBatchTableBinary.b3dm -o ./output/optimized.b3dm
```

Quantize floating-point attributes and oct-encode normals
```
node ./bin/3d-tiles-tools.js optimizeB3dm -i ./specs/data/batchedWithBatchTableBinary.b3dm -o ./output/optimized.b3dm --options -q -n
```

| Flag | Description | Required |
| ---- | ----------- | -------- |
|`-i`, `--input`| Input path of the `.b3dm`| :white_check_mark: Yes |
|`-o`, `--output`| Output path of the resulting `.b3dm` | No |
|`-f`, `--force`|Overwrite output file if it exists.| No, default `false` |
|`--options`|All arguments past this flag are consumed by gltf-pipeline.| No |

To use tileset texture compression, pass the [`texcomp` flags](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/blob/master/README.md#command-line-flags)
```
node ./bin/3d-tiles-tools.js optimizeB3dm -i ./specs/data/Textured/batchedTextured.b3dm -o ./output/optimized.b3dm --options --texcomp.dxt1.enable --texcomp.dxt1.quality=5 --texcomp.etc1.enable
```
This example optimizes the b3dm and compresses the textures into `dxt1` and `etc1` formats.

### optimizeI3dm

Optimize a i3dm using [gltf-pipeline](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/blob/master/README.md).
Since this tool does not process an entire tileset, it cannot be used with the Pipeline tool.

```
node ./bin/3d-tiles-tools.js optimizeI3dm -i ./specs/data/instancedWithBatchTableBinary.i3dm -o ./output/optimized.i3dm
```

Quantize floating-point attributes and oct-encode normals
```
node ./bin/3d-tiles-tools.js optimizeI3dm -i ./specs/data/instancedWithBatchTableBinary.i3dm -o ./output/optimized.i3dm --options -q -n
```

| Flag | Description | Required |
| ---- | ----------- | -------- |
|`-i`, `--input`| Input path of the `.i3dm`| :white_check_mark: Yes |
|`-o`, `--output`| Output path of the resulting `.i3dm` | No |
|`-f`, `--force`|Overwrite output file if it exists.| No, default `false` |
|`--options`|All arguments past this flag are consumed by gltf-pipeline.| No |

To use tileset texture compression, pass the [`texcomp` flags](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/blob/master/README.md#command-line-flags).
```
node ./bin/3d-tiles-tools.js optimizeI3dm -i ./specs/data/Textured/instancedTextured.i3dm -o ./output/optimized.i3dm --options --texcomp.dxt1.enable --texcomp.dxt1.quality=5 --texcomp.etc1.enable
```
This example optimizes the i3dm and compresses the textures into `dxt1` and `etc1` formats.

### tilesetToDatabase

Generates a sqlite database for a tileset.

This tool cannot be used with the Pipeline tool.

Each tile is stored gzipped in the database.  The specification for the tables in the database is not final, see [3d-tiles/#89](https://github.com/AnalyticalGraphicsInc/3d-tiles/issues/89).

```
node ./bin/3d-tiles-tools.js tilesetToDatabase ./specs/data/TilesetOfTilesets/ ./output/tileset.3dtiles
```
```
node ./bin/3d-tiles-tools.js tilesetToDatabase -i ./specs/data/TilesetOfTilesets/ -o ./output/tileset.3dtiles
```

| Flag | Description | Required |
| ---- | ----------- | -------- |
|`-i`, `--input`| Input directory of the tileset. | :white_check_mark: Yes |
|`-o`, `--output`| Output path of the resulting `.3dtiles`. | No |
|`-f`, `--force`| Overwrite output file if it exists. | No, default `false` |

### databaseToTileset

Unpack a tileset database to a tileset folder.

This tool cannot be used with the Pipeline tool.

Each tile is stored gzipped in the database, and unzipped when unpacked.  The specification for the tables in the database is not final, see [3d-tiles/#89](https://github.com/AnalyticalGraphicsInc/3d-tiles/issues/89).

```
node ./bin/3d-tiles-tools.js databaseToTileset ./specs/data/tileset.3dtiles ./output/Tileset
```
```
node ./bin/3d-tiles-tools.js databaseToTileset -i ./specs/data/tileset.3dtiles -o ./output/Tileset
```

| Flag | Description | Required |
| ---- | ----------- | -------- |
|`-i`, `--input`| Input .3dtiles database file. | :white_check_mark: Yes |
|`-o`, `--output`| Output directory of the unpacked tileset. | No |
|`-f`, `--force`| Overwrite output directory if it exists. | No, default `false` |

## Pipeline

```
node ./bin/3d-tiles-tools.js pipeline ./specs/data/pipeline.json
```
```
node ./bin/3d-tiles-tools.js pipeline -i ./specs/data/pipeline.json
```

|Flag|Description|Required|
|----|-----------|--------|
|`-i`, `--input`|Input pipeline JSON file.| :white_check_mark: Yes|
|`-f`, `--force`|Overwrite output directory if it exists.|No, default `false`|

Executes a pipeline JSON file containing an input directory, output directory, and list of stages to run.
A stage can be a string specifying the stage name or an object specifying the stage name and any additional parameters.
Stages are executed in the order listed.

This example `pipeline.json` gzips the input tilest and saves it in the given output directory.

```json
{
    "input": "Tileset/",
    "output": "TilesetGzipped/",
    "stages": ["gzip"]
}
```

This pipeline uncompresses the input tileset and then compresses all the tiles. Files like tileset.json are left uncompressed.

```json
{
    "input": "Tileset/",
    "output": "TilesetGzipped/",
    "stages": [
        "ungzip",
        {
            "name": "gzip",
            "tilesOnly": true
        }
    ]
}
```

###Pipeline Stages

####gzip

Gzips the input tileset.

**Properties**

|   |Type|Description|Required|
|---|----|-----------|--------|
|**tilesOnly**|`boolean`|Only gzip tiles.|No, default: `false`|

####ungzip

Ungzips the input tileset.

## Build Instructions

Run the tests:
```
npm run test
```
To run ESLint on the entire codebase, run:
```
npm run eslint
```
To run ESLint automatically when a file is saved, run the following and leave it open in a console window:
```
npm run eslint-watch
```

### Running Test Coverage

Coverage uses [istanbul](https://github.com/gotwarlost/istanbul).  Run:
```
npm run coverage
```
For complete coverage details, open `coverage/lcov-report/index.html`.

The tests and coverage covers the Node.js module; it does not cover the command-line interface.

## Generating Documentation

To generate the documentation:
```
npm run jsDoc
```

The documentation will be placed in the `doc` folder.

### Debugging

* To debug the tests in Webstorm, open the Gulp tab, right click the `test` task, and click `Debug 'test'`.
* To run a single test, change the test function from `it` to `fit`.
