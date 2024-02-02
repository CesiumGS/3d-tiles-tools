# @3d-tiles-tools/metadata

Implementations for the 3D Metadata Specification

## Directory structure

- `./src/metadata/`: Classes for an implementation of the 3D Metadata Specification
  - Utilities for dealing with the JSON representations of metadata objects `ClassProperties`/`MetadataTypes`/`MetadataComponentTypes`...
  - Internal utilities for processing metadata values (e.g. normalization, `offset` and `scale` etc.), in `MetadataValues` and `ArrayValues`.
  - The `PropertyTableModel`, `MetadataEntityModel` and `PropertyModel` interfaces offer a very thin and simple abstraction layer for 3D Metadata. The structure of these classes is shown here:
  ![PropertyTable](../../figures/PropertyTable.png)
  - Implementations of these interfaces exist:
    - For the JSON-based representation of metadata entities, metadata entity model instances can be created with `MetadataEntityModels`
    - `./src/metadata/binary` contains implementations of the metadata interfaces for _binary_ data, with `BinaryPropertyTableModel` being the top-level class, implementing the `PropertyTableModel` interface.
