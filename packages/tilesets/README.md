# @3d-tiles-tools/tilesets

Classes for handling 3D Tiles tileset data.

## Directory structure

- `./src/implicitTiling/`: Classes that represent the structure and information of implicit tilesets
  - `AvailabilityInfo`: A simple interface for representing information about the availability of tiles, content, or child subtrees in implicit tiling. This is accessed with an _index_. Instances of classes implementing this interface can be created with the `AvailabilityInfos` class. 
  - `SubtreeInfo`: A structure that combines the `AvailabilityInfo` for tiles, content, and child subtrees (as it is defined in the input data). Instances of this structure can be created from a subtree JSON file or from binary subtree data, using the `SubtreeInfos` class.
  - `BinarySubtreeData`: A simple structure from which the `SubtreeInfo` is created. It combines the data that represents a 'subtree' in implicit tiling, in its 'raw' form: It contains the `Subtree` JSON object, as well as a `BinaryBufferStructure`/`BinaryBufferData` that was created from the `buffers/bufferViews` and the resolved binary data
  - `BinarySubtreeDataResolver`: A class that receives a `Subtree` JSON object, and returns the `BinarySubtreeData`, resolving all external `buffer.uri` references
  - `ImplicitTilingError`: An error indicating that implicit tiling data was structurally invalid
  - `ImplicitTilings`: Methods that try to hide the difference between `QUADTREE` and `OCTREE` tilings. They usually receive a `TileImplicitTiling` JSON object, and perform operations that _depend_ on the `subdivisionScheme`, but can be applied _agnostically_ of the subvision scheme. (Note: Some of this could be done in a cleaner and more generic way, involving ... generics (sic). This _does_ already exist (in a different language), but carrying type parameters along, as in `Availability<TreeCoordinates<Octree>>` can look obscure and "overengineered" at the first glance. I only hope that the current solution here does not turn out to be _underengineered_ ...)
  - `TemplateUris`: Internal method to substitute quadtree- or octree coordinates into template URIs

- `./src/packages`: Classes for reading or creating 3D Tiles Package files
  - These are implementations of the `TilesetSource` and `TilesetTarget` interface (see `./src/tilesetData`), based on 3TZ or 3DTILES

- `./src/tileFormats`: Classes for handling the (legacy) tile formats, B3DM, I3DM, PNTS and CMPT
  - `TileData` as a data structure for B3DM, I3DM, PNTS
  - `CompositeTileData` as a data structure for ... composite tile data (hence the name...)
  - `TileFormats`: Methods for handling tile data, mainly reading/writing tile data from/to buffers

- `./src/tilesetData`: Abstractions for the "files" that are "a tileset"
  - The goal is to have an abstraction that works for file systems as well as 3D Tiles packages (3TZ or 3DTILES)
  - The elements/etries are given as `key:string` which is the file name, and a `value:Buffer` which is the file contents
  - `TilesetSource` allows iterating over the entries
  - `TilesetTarget` allows collecting entries and writing them out


- `./src/tilesets`: Utility functions for tileset operations
  - `Tiles` for traversing (explicit!) tile hierarchies
  - `Tilesets` offering convenience functions for `merge/combine/upgrade`
  - `Contents` with utility functions related to tile `content` objects
  - `Extensions` for handling extensions and extension declarations in tilesets (and glTF objects)

- `./src/tileTabledata`: Classes for handling the batch- and feature table data in the (legacy) tile formats, B3DM, I3DM, PNTS and CMPT
  - `TileTableData`: Methods for accessing values from batch- and feature tables in a generic form (mainly as iterables or arrays of numbers)
  - `TileTableDataPnts`: Methods for accessing the batch- and feature table values that are specific for PNTS
  - `TileTableDataI3dm`: Methods for accessing the batch- and feature table values that are specific for I3DM

- `./src/traversal`: Classes for traversing tilesets
  - NOTE: The `SubtreeModel`/`SubtreeMetadataModel` interfaces _might_ at some point be moved into `implicitTiling`, but are currently tailored for the use in the traversal classes, and should be considered to be an "implementation detail" here.
  - The `TilesetTraverser` class is the entry point for the traversal. It allows traversing a tileset, and offer each traversed tile as a `TraversedTile` instance. The `TraversedTile` describes a tile during traversal (e.g. with a parent, and semantic-based overrides)

