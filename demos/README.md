## 3D Tiles Tools Demos

This project declares the 3D Tiles tools build output as (local) dependency. The demos show how to use various parts of the API. This is intended as an internal preview for developers. The functionality is not yet exposed as a public API.

In the root directory of the 3D Tiles tools:

- Install the 3D Tiles Tools dependencies:
  `npm install`
- Create the build output of the 3D Tiles tools:
  `npm run build`

In the `/demos/` subdirectory:

- Install the 3D Tiles Tools build output as a dependency:
  `npm install`

Then, each of these demos can be started (from the root directory of the 3D Tiles Tools!) with

`npx ts-node ./demos/`_`<PackageName>`_`/`_`<DemoName>`_`.ts`

### General tool functions

- `BinaryMetadataDemos`: Examples that show how to create and access `BinaryPropertyTableModel` instances with different types of properties.
- `ContentDataTypeChecksDemo`: Shows how to use `ContentDataTypeChecks` to check whether content data has a certain type
- `ContentDataTypeRegistryDemo`: Shows how to query the type of content data from the `ContentDataTypeRegistry`
- `MetadataDemos`: Examples that show how to work with `MetadataEntityModel` instances for accessing JSON-based metadata entities.
- `PackageConversion`: A command-line tool for converting from files/3TZ/3DTILES/ZIP to files/3TZ/3DTILES
- `PackagesDemo`: Show how to read/create/write 3D Tiles packages
- `PackageServer`: A **very** basic server that serves data from an arbitrary 3D Tiles package
  - To be used with the `PackageSandcastle`
- `Pipeline...`: **Preliminary** drafts for the `pipelines` functionalities
- `SpatialDemos`: Very basic examples showing how to use the quadree- and octree classes in `spatial`
- `SubtreeInfoDemos`: A demo that shows how to use the `SubtreeInfo` class to access (binary) subtree data
- `TileFormatsDemoBasic`: Basic usage demos for the `TileFormats` class
- `TileFormatsDemoConversions`: Demos showing how to use the `TileFormats` class for conversions (like extracting GLB from B3DM etc.)
- `TilesetProcessingDemos`: Demos for the `combine/merge/upgrade` functions
- `TilesetProcessorExamples`: Very basic demo of the `BasicTilesetProcessor` functions
- `TilesetUpgraderDemos`: More fine-grained demos for the upgrade functionality
- `TraversalDemo`: A basic example showing how to traverse a tileset
- `TraversalStatsDemo`: A basic example showing how to traverse a tileset and collect statistical information in the process.

The `./tilesets/benchmarks` folder contains very basic benchmarks for creating/reading different 3D Tiles package formats.

