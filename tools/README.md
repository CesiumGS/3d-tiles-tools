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

Executes a pipeline JSON file containing an input path, output path, and list of stages to run.
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
|**verbose**|`boolean`|Prints out debug messages to the console.|No, default: `false`|

####ungzip

Ungzips the input tileset.

**Properties**

|   |Type|Description|Required|
|---|----|-----------|--------|
|**verbose**|`boolean`|Prints out debug messages to the console.|No, default: `false`|

## Build Instructions

Run the tests:
```
npm run test
```
To run JSHint on the entire codebase, run:
```
npm run jsHint
```
To run JSHint automatically when a file is saved, run the following and leave it open in a console window:
```
npm run jsHint-watch
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