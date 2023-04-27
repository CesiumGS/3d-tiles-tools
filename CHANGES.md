Change Log
==========

### 0.2.1 - 2023-04-27

- Internal refactorings and bugfixes for tileset processing and pipelines: 
  - The tileset JSON had been written in gzipped form if and only if it was read in gzipped form, to mimic the previous behavior of functions like `combineTilesets.js`. 
  - This caused the tileset JSON to not be zipped even when the `gzip` command was applied ([#22](https://github.com/CesiumGS/3d-tiles-tools/issues/22)). 
  - Now, the tileset JSON will always be written in unzipped form by default. 
  - The `gzip` and `ungzip` commands are implemented as 'tileset stages' that do not apply any special handling to the tileset JSON. 
  - The filters for included- and excluded content types have been mored from the 'content stage' to the 'tileset stage' accordingly, because the content stages already are specific for certain content types, and will check these types internally.
  - The default handling of the case that the included content types are `undefined` has changed: Content types will be _included_ by default now. To not include anything, and empty array can be used.
- Allow passing options to the `upgrade` command that will be forwarded to `gltf-pipeline`
- Added (auto-generated) TSDoc documentation to the 3D Tiles classes in the `structure` directory
- Fixed a bug in the `analyze` command that caused a wrong payload length to be reported
- Fixed a bug that caused single-element `contents` arrays to be created in tiles in `BasicTilesetProcessor`

### 0.2.0 - 2023-04-14

* Rewrite

### 0.1.3 - 2017-04-14

* Cleaned up project files and upgraded dependencies. [#70](https://github.com/CesiumGS/3d-tiles-validator/pull/70)

### 0.1.2 - 2017-04-07

* Breaking changes
    * `extractB3dm` and `extractI3dm` now return the feature table JSON and batch table JSON instead of buffers.
    * `glbToB3dm` and `glbToI3dm` now take feature table JSON and batch table JSON instead of buffers.
* Handle b3dm tiles with the legacy 24-byte header. [#69](https://github.com/CesiumGS/3d-tiles-validator/pull/69)

### 0.1.1 - 2017-03-15

* Breaking changes
    * Renamed `tileset2sqlite3` to `tilesetToDatabase`.
* Added `databaseToTileset` for unpacking a .3dtiles file to a tileset directory. [#62](https://github.com/CesiumGS/3d-tiles-validator/pull/62)
* Added  `glbToI3dm` and `optimizeI3dm` command line tools. [#46](https://github.com/CesiumGS/3d-tiles-validator/pull/46)
* Handle b3dm tiles with the legacy 20-byte header. [#45](https://github.com/CesiumGS/3d-tiles-validator/pull/45)
* Added `extractCmpt` to extract inner tiles from a cmpt tile and the `cmptToGlb` command line tool. [#42](https://github.com/CesiumGS/3d-tiles-validator/pull/42)

### 0.1.0 - 2016-12-16

* Initial release.