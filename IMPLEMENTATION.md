# 3D Tiles Tools Implementation Notes

Parts of the current implementation may still change. This page is only a short description of the overall structure.

## Directory structure:

- `./src`: The entry point for the command line interface is in `main.ts`

- `./src/base`: Generic, low-level utility functions.
  Most of the functions here are grouped into classes.
  - `Buffers`: Padding, detecting GZIPpedness, obtaining "magic" bytes...
  - `DeveloperError`: An error that was caused by the _developer_ (i.e. someone used the API in a wrong way)
  - `Iterables`: Iterating over files, filtering, mapping...
  - `Paths`: Resolving, checking/changing file extensions, ...
  - `Uris`: Detect data URIs or absolute URIs
  - Special cases: `defined` and `defaultValue`. These have some documentation explaining why they should rarely be used in TypeScript.

- `./src/contentOperations`: Operations that are applied to tile content
  - `ContentOps`: Functions like ZIP/unZIP, conversions like `glbToB3dm`, _always_ operating on buffers: "Buffer in - Buffer out"
  - `GltfUtilites`/`GltfPipelineLegacy`: Wrappers around `gltf-pipeline` (e.g. for optimizing/upgrading the GLB in a B3DM)

- `./src/contentTypes`: Classes for determining the type of content data
  - `ContentData` as the main interface, implemented as `BufferedContentData` (to be created from a buffer that already exists in memory), or `LazyContentData` (that resolves "as little data as possible" to determine the content type)
  - `ContentDataTypeRegistry`: Receives a `ContentData` object and returns a string that indicates the type, like `CONTENT_TYPE_B3DM` or `CONTENT_TYPE_TILESET`.
  - `ContentDataTypeChecks`: Offers methods to create predicates that check for certain `included/excluded` content types

- `./src/io`: Classes for "loading data" in a very generic way, from different sources
  - `ResourceResolver` is the main interface, with the core functionality of receiving a URI and returning the data for that URI, with implementations to obtain that data e.g. from a file system or from a 3D Tiles Package.

- `./src/packages`: Classes for reading or creating 3D Tiles Package files
  - These are implementations of the `TilesetSource` and `TilesetTarget` interface (see `./src/tilesetData`), based on 3TZ or 3DTILES

- `./src/pipelines`: **Preliminary** classes for modeling "processing pipelines" for tilesets

- `./src/structure`: Plain old data objects for the elements of a Tileset JSON
  - E.g. `Tileset`, `Tile`, `Content`, ...
  - The goal is to have a _typed_ representation of a tileset JSON (assuming that the input JSON was indeed structurally valid - there are no validations or actual type checks during deserialization)

- `./src/tileFormats`: Classes for handling the (legacy) tile formats, B3DM, I3DM, PNTS and CMPT
  - `TileData` as a data structure for B3DM, I3DM, PNTS
  - `CompositeTileData` as a data structure for ... composite tile data (hence the name...)
  - `TileFormats`: Methods for handling tile data, mainly reading/writing tile data from/to buffers

- `./src/tilesetData`: Abstractions for the "files" that are "a tileset"
  - The goal is to have an abstraction that works for file systems as well as 3D Tiles packages (3TZ or 3DTILES)
  - The elements/etries are given as `key:string` which is the file name, and a `value:Buffer` which is the file contents
  - `TilesetSource` allows iterating over the entries
  - `TilesetTarget` allows collecting entries and writing them out

- `./src/tilesetProcessing`: Higher-level operations on tilesets
  - `TilesetCombiner`: Used to "inline" external tilesets into a single one
  - `TilesetMerger`: Used to create one tileset that refers to others as external tilesets
  - `TilesetUpgrader`: Upgrade a tileset to a newer version (many aspects unspecified here)

- `./src/tilesets`: Utility functions for tileset operations
  - `Tiles` for traversing (explicit!) tile hierarchies
  - `Tilesets` offering convenience functions for `merge/combine/upgrade`

## Demos

The `./demos/` folder contains demos that show how to use various parts of the API

- `ContentDataTypeChecksDemo`: Shows how to use `ContentDataTypeChecks` to check whether content data has a certain type
- `ContentDataTypeRegistryDemo`: Shows how to query the type of content data from the `ContentDataTypeRegistry`
- `PackageConversion`: A command-line tool for converting from files/3TZ/3DTILES/ZIP to files/3TZ/3DTILES
- `PackagesDemos`: Show how to read/create/write 3D Tiles packages
- `PackageServer`: A **very** basic server that serves data from an arbitrary 3D Tiles package
  - To be used with the `PackageSandcastle`
- `PipelineDrafts`: **Preliminary** drafts for the `pipelines` functionalities
- `TileFormatsDemoBasic`: Basic usage demos for the `TileFormats` class
- `TileFormatsDemoConversions`: Demos showing how to use the `TileFormats` class for conversions (like extracting GLB from B3DM etc.)
- `TilesetProcessingDemos`: Demos for the `combine/merge/upgrade` functions
- `TilesetUpgraderDemos`: More fine-grained demos for the upgrade functionality

The `./demos/benchmarks` folder contains very basic benchmarks for creating/reading different 3D Tiles package formats.