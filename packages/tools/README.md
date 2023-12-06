# @3d-tiles-tools/tools

The main package with implementations of the 3D Tiles Tools functionality.

## Directory structure

- `./src/contentProcessing`: Operations that are applied to tile content
  - `ContentOps`: Functions like `glbToB3dm`, _always_ operating on buffers: "Buffer in - Buffer out"
  - `GltfUtilites`/`GltfPipelineLegacy`: Wrappers around `gltf-pipeline` (e.g. for optimizing/upgrading the GLB in a B3DM)
  - `GltfPack`: Wrappers around `gltfpack` (e.g. for applying meshopt compression)
  - `GltfTransform`: Wrappers around `glTF-Transform` (e.g. for applying meshopt compression)

- `./src/draco`: Utility classes for Draco decoding
  - `DracoDecoder`: A thin wrapper around Draco, mainly for decoding `3DTILES_draco_point_compression` data
  - `DracoDecoderResult` + related classes: Summarizes the result of decoding `3DTILES_draco_point_compression` data

- `./src/gltfExtensionUtils`: Utility classes related to the Cesium glTF extension implementations

- `./src/migration/`: Classes related to the migration of "legacy" tile formats to glTF+extensions
  - `TileFormatsMigration`: The main class with the entry points to convert legacy tile formats into glTF+Extensions
    - `TileFormatsMigrationB3dm/I3dm/Pnts`: The classes containing the format-specific migrations
  - `BatchTableSchemas`: Methods to create metadata `Schema` objects that describe the structure and properties of batch tables
  - `BatchTableClassProperties`: Methods for creating the metadata `ClassProperty` objects from the property information that is contained in batch tables
  - `BatchTablePropertyTableModels`: Methods to create `PropertyModel` instances for the "columns" of a batc table
  - `BatchTables`: Internal utility methods
  - `Ids`: Methods to convert (legacy) batch table property names into "property IDs", with the constraints that are given by the 3D Metadata specification
  - `NumberTypeDescriptions` and `TypeDetection`: Methods for "best-effort guesses" about the metadata property type that may be used for representing batch table properties that had been given as JSON
  - `TileTableDataToMeshFeatures`: Methods for creating the glTF `EXT_mesh_features` extension objects from table data, specifically for converting the `_BATCHID` attributes into the extension objects that use the `_FEATURE_ID_n` attribute
  - `TileTableDataToStructuralMetadata`: Methods for converting batch table information into an `EXT_structural_metadata` representation. This can either convert batch table columns into per-point property attributes for point clouds, or it can convert batch tables into `PropertyTable` objects
  - `AccessorCreation`: Methods for creating glTF-Transform `Accessor` objects from `PropertyModel` objects - basically converting the "table column" that is represented with the `PropertyModel` into a glTF vertex attribute

- `./src/pipelines`: **Preliminary** classes for modeling "processing pipelines" for tilesets
  - The `Pipeline` class describes the pipeline with its input and output, and contains one or more `TilesetStage` objects
  - The `TilesetStage` describes an operation that is applied to the tileset as a whole, usually focussing on modifications of the tileset JSON object. It may contain one or more `ContentStage` objects
  - The `ContentStage` is an operation that may be applied to tile content (i.e. "files") that are part of the tileset
  - Instances of these classes may be created with the `Pipelines`, `TilesetStages`, and `ContentStages` classes, respectively
  - A pipeline may be executed by a `PipelineExecutor`.

- `./src/pointClouds`: Utility classes for point clouds, focussing on reading PNTS and writing GLB
  - `ReadablePointCloud`: An abstraction of "point cloud data" (read from PNTS, written to GLB)
  - `PntsPointClouds`: Creates `ReadablePointCloud` objects from PNTS data
  - `GltfTransformPointClouds`: Converts `ReadablePointCloud` objects into glTF/GLB assets

- `./src/tilesetProcessing`: Higher-level operations on tilesets
  - `TilesetCombiner`: Used to "inline" external tilesets into a single one
  - `TilesetMerger`: Used to create one tileset that refers to others as external tilesets
  - `TilesetUpgrader`: Upgrade a tileset to a newer version (many aspects unspecified here)
  - The (abstract) `TilesetProcessor` class and the (concrete) `BasicTilesetProcessor` class offer an infrastructure for generic operations on the tilesets and their content. These classes serve as the basis for the implementation of the pipeline execution functionality. 
