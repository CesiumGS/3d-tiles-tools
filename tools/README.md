# 3D Tiles Tools

Library and command-line tools for processing and converting 3D Tiles tilesets.

## Instructions

Clone this repo and install [Node.js](http://nodejs.org/).  From the root directory of this repo, run:
```
npm install
```

## Command line tools

### pipeline

```
node ./bin/3d-tiles-tools.js pipeline -i ./specs/data/pipeline.json
```

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
        "gunzip",
        {
            "name": "gzip",
            "tilesOnly": true
        }
    ]
}
```


It is also possible to run stages individually:

### gzip

Gzips the input tileset.

```
node ./bin/3d-tiles-tools.js gzip -i ./specs/data/TilesetOfTilesets/ -o ./output/TilesetOfTilesets-gzipped/
```

### gunzip

Gunzips the input tileset.

```
node ./bin/3d-tiles-tools.js gunzip -i ./specs/data/TilesetOfTilesets/ -o ./output/TilesetOfTilesets-gunzipped/

```
