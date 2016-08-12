# 3D Tiles Tools

Command line utilities for processing and converting 3D Tiles tilesets.

## Instructions

Clone this repo and install [Node.js](http://nodejs.org/).  From the root directory of this repo, run:
```
npm install
```

## Tools

### gzipTileset

Gzips the input tileset.

```
node ./bin/gzipTileset.js -i ./specs/data/TilesetOfTilesets/ -o ./output/TilesetOfTilesets-gzipped/
```

### gunzipTileset

Gunzips the input tileset.

```
node ./bin/gunzipTileset.js -i ./specs/data/TilesetOfTilesets/ -o ./output/TilesetOfTilesets-gunzipped/
```
