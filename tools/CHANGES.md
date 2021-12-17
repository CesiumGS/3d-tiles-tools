Change Log
==========

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