# @3d-tiles-tools/base

Basic classes for the 3D Tiles Tools

## Directory structure

- `./src/base`: Generic, low-level utility functions.
  Most of the functions here are grouped into classes.
  - `Buffers`: Padding, detecting GZIPpedness, obtaining "magic" bytes...
  - `DataError`: An error indicating that input data was invalid on a low level (e.g. invalid binary data, or unparseable JSON)
  - `DeveloperError`: An error that was caused by the _developer_ (i.e. someone used the API in a wrong way)
  - `Iterables`: Iterating over files, filtering, mapping...
  - `Paths`: Resolving, checking/changing file extensions, ...
  - `Uris`: Detect data URIs or absolute URIs
  - Special cases: `defined` and `defaultValue`. These have some documentation explaining why they should rarely be used in TypeScript.

- `./src/binary`: Common classes for the `buffer/bufferView` concept
  - `BinaryBufferStructure`: A class that describes the "JSON part" of buffers and buffer views (i.e. their data layout and buffer URIs)
  - `BinaryBufferData`: A class that contains the actual data of buffers and buffer views as JavaScript `Buffer`s
  - `BinaryBufferDataResolver`: Resolves the `BinaryBufferData` for a given `BinaryBufferStructure`

- `./src/contentTypes`: Classes for determining the type of content data
  - `ContentData` as the main interface, implemented as `BufferedContentData` (to be created from a buffer that already exists in memory), or `LazyContentData` (that resolves "as little data as possible" to determine the content type)
  - `ContentDataTypes`: A set of strings representing different content data types, like `CONTENT_TYPE_B3DM` or `CONTENT_TYPE_TILESET`.
  - `ContentDataTypeRegistry`: Receives a `ContentData` object and returns one of the `ContentDataTypes` strings
  - `ContentDataTypeChecks`: Offers methods to create predicates that check for certain `included/excluded` content types

- `./src/io`: Classes for "loading data" in a very generic way, from different sources
  - `ResourceResolver` is the main interface, with the core functionality of receiving a URI and returning the data for that URI, with implementations to obtain that data e.g. from a file system or from a 3D Tiles Package.

- `./src/logging`: Classes for managing loggers

- `./src/spatial`: Basic classes for dealing with tree structures, specifically with quadtrees and octrees
