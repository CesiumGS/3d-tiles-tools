Change Log
==========

### 0.3.1 - 2023-10-10
- Integrated a dedicated logging library (via [#61](https://github.com/CesiumGS/3d-tiles-tools/pull/61))
  - By default, only few, informative messages are logged to the console
  - There are additional command-line arguments:
    - `--logLevel` can be used to set the log level (`trace`, `debug`, `info`, `warn`, `error`, `fatal`, and `silent`)
    - `--logJson` to print log messages as JSON instead of pretty-printed
- The `convertI3dmToGlb` functionality has been added to the CLI (in addition to the existing `convertB3dmToGlb` and `convertPntsToGlb`)
- **Internal** restructuring (mainly for the use of the `3d-tiles-tools` in the `3d-tiles-validator`):
  - Exposed and generalized `GltfUtilities`: It now offers a function `extractDataFromGlb` that returns the JSON- and binary buffer from arbitrary glTF 1.0 or 2.0 buffers
  - Extracted a `BinaryMetadata` structure from the former `BinaryPropertyTable`
  - The different representations of `ENUM` values (namely, as numbers or as strings) had not been handled correctly (via [#71](https://github.com/CesiumGS/3d-tiles-tools/issues/71))
  - Internal fixes for KTX encoding (via [#40](https://github.com/CesiumGS/3d-tiles-tools/pull/40) - not yet part of a public functionality)


### 0.3.0 - 2023-08-30

- Transparently decompress entries in `3tz` files when they are compressed with `DEFLATE` (via [#55](https://github.com/CesiumGS/3d-tiles-tools/pull/55))
  - The exact behavior in terms of entry compression is not specified yet. This is tracked in [#56](https://github.com/CesiumGS/3d-tiles-tools/issues/56)
- Extended the handling of tileset JSON files for the `convert` command (via [#54](https://github.com/CesiumGS/3d-tiles-tools/pull/54))
  - The `convert` command did not anticipate that the `.3dtiles` and `.3tz` formats require the top-level tileset file to be called `tileset.json`. This is enforced now. For cases where the input is ambiguous (for example, for a ZIP file or a directory that contain multiple tileset JSON files, with none being called `tileset.json`), the name of the top-level tileset JSON file can be defined with the `--inputTilesetJsonFileName` command line argument.
- The `upgrade` command has been generalized (via [#41](https://github.com/CesiumGS/3d-tiles-tools/pull/41) and [#52](https://github.com/CesiumGS/3d-tiles-tools/pull/52))
  - The default behavior of the the `upgrade` command remained unaffected
  - When passing in the `--targetVersion 1.1` command line argument, then the upgrade will attempt to do a more extensive upgrade of the (legacy) PNTS, B3DM, and I3DM tile formats. It will convert these tile formats into glTF assets that use the `EXT_structural_metadata`, `EXT_mesh_features`, and `EXT_instance_features` extensions, to represent the former batch- and feature table information. This is intended as a _preview feature_. The CMPT format can not yet be upgraded. There are corner cases (for example, animations in the glTF assets that are used for I3DM) that can not generically be translated into glTF assets with extensions. The scope and configurability of the command will be extended and specified more extensively in the future.
- The behavior of `b3dmToGlb` and `i3dmToGlb` commands has changed: They originally upgraded any glTF 1.0 content that they encountered to glTF 2.0. Now, they _only_ extract the actual glTF data as it is. 
- Operations that modified the content of tiles (for example, converting B3DM to GLB) only had been applied to the top-level input tileset. Now, these operations by default are also applied to the contents of _external_ tilesets that are referred to from the top-level tileset (via [#42](https://github.com/CesiumGS/3d-tiles-tools/pull/42) and [#48](https://github.com/CesiumGS/3d-tiles-tools/pull/48))
- Certain operations on tilesets caused the output tileset to use a `tile.contents[]` array even when there only was a single content. This was fixed in [#38](https://github.com/CesiumGS/3d-tiles-tools/pull/38), to make sure that a single `tile.content` is used in these cases, and the `tile.contents[]` array only when there actually are multiple contents.
- Added further `structure` classes that are (largely) auto-generated from JSON schema (via [#36](https://github.com/CesiumGS/3d-tiles-tools/pull/36))
  - The classes in the `structure/TileFormats` package represent the batch- and feature table JSON of the (legacy) tile formats
  - The classes in the `structure/Style` package represent the JSON structures for 3D Tiles styling

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