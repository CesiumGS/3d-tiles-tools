import { defined } from "../base/defined";

import { Schema } from "../structure/Metadata/Schema";

import { MetadataError } from "../metadata/MetadataError";
import { MetadataUtilities } from "../metadata/MetadataUtilities";
import { PropertyTableModel } from "../metadata/PropertyTableModel";

import { BinaryPropertyTable } from "../metadata/binary/BinaryPropertyTable";
import { BinaryPropertyTableModel } from "../metadata/binary/BinaryPropertyTableModel";

import { BinarySubtreeData } from "../implicitTiling/BinarySubtreeData";
import { SubtreeInfo } from "../implicitTiling/SubtreeInfo";
import { AvailabilityInfo } from "../implicitTiling/AvailabilityInfo";

import { SubtreeMetadataModel } from "./SubtreeMetadataModel";

/**
 * Methods to create `SubtreeMetadataModel` instances
 *
 * @internal
 */
export class SubtreeMetadataModels {
  /**
   * Creates a `SubtreeMetadataModel` from the given data.
   *
   * TODO Maybe add some proper comment here...
   *
   * @param binarySubtreeData - The `BinarySubtreeData`
   * @param subtreeInfo - The `SubtreeInfo`
   * @param schema - The metadata `Schema`
   * @returns The `SubtreeMetadataModel`
   */
  static create(
    binarySubtreeData: BinarySubtreeData,
    subtreeInfo: SubtreeInfo,
    schema: Schema
  ): SubtreeMetadataModel {
    const subtree = binarySubtreeData.subtree;
    const binaryBufferStructure = binarySubtreeData.binaryBufferStructure;
    const binaryBufferData = binarySubtreeData.binaryBufferData;

    // Obtain the structural information about the schema that
    // is required for creating the property table models
    const propertyTableModels = [];
    const binaryEnumInfo = MetadataUtilities.computeBinaryEnumInfo(schema);
    const propertyTables = subtree.propertyTables;
    if (propertyTables) {
      const classes = schema.classes ?? {};

      for (const propertyTable of propertyTables) {
        const classId = propertyTable.class;
        const metadataClass = classes[classId];
        if (!metadataClass) {
          throw new MetadataError(
            `The property table refers to class ${classId}, ` +
              `but the schema does not define this class`
          );
        }

        // Create the `BinaryPropertyTable` for each property table,
        // which contains everything that is required for creating
        // the binary PropertyTableModel
        const binaryPropertyTable: BinaryPropertyTable = {
          propertyTable: propertyTable,
          metadataClass: metadataClass,
          binaryEnumInfo: binaryEnumInfo,
          binaryBufferStructure: binaryBufferStructure,
          binaryBufferData: binaryBufferData,
        };
        const propertyTableModel = new BinaryPropertyTableModel(
          binaryPropertyTable
        );
        propertyTableModels.push(propertyTableModel);
      }
    }

    // Obtain the property table model that is pointed to
    // by subtree.tileMetadata
    let tileMetadataModel = undefined;
    if (defined(subtree.tileMetadata)) {
      tileMetadataModel = propertyTableModels[subtree.tileMetadata];
      if (!tileMetadataModel) {
        throw new MetadataError(
          `The subtree tileMetadata refers to property ` +
            `table ${subtree.tileMetadata}, but the subtree only ` +
            `defines ${propertyTableModels.length} property tables`
        );
      }
    }

    // Obtain the property table models that are pointed to
    // by subtree.contentMetadata
    const contentMetadataModels: PropertyTableModel[] = [];
    if (subtree.contentMetadata) {
      for (const contentMetadata of subtree.contentMetadata) {
        const contentMetadataModel = propertyTableModels[contentMetadata];
        if (!contentMetadataModel) {
          throw new MetadataError(
            `The subtree contentMetadata refers to property ` +
              `table ${contentMetadata}, but the subtree only ` +
              `defines ${propertyTableModels.length} property tables`
          );
        }
      }
    }

    // Compute the mapping from (available) tiles to the indices
    // of their metadata (i.e. the row index in the property table
    // that contains the metadata for the respective tile)
    const tileAvailabilityInfo = subtreeInfo.tileAvailabilityInfo;
    const tileMetadataIndexMapping =
      SubtreeMetadataModels.computeAvailabilityIndexingMapping(
        tileAvailabilityInfo
      );

    // Compute the mapping from (available) contents to the indices
    // of their metadata (i.e. the row index in the property table
    // that contains the metadata for the respective content)
    const contentMetadataIndexMappings: number[][] = [];
    const contentAvailabilityInfos = subtreeInfo.contentAvailabilityInfos;
    for (const contentAvailabilityInfo of contentAvailabilityInfos) {
      const contentMetadataIndexMapping =
        SubtreeMetadataModels.computeAvailabilityIndexingMapping(
          contentAvailabilityInfo
        );
      contentMetadataIndexMappings.push(contentMetadataIndexMapping);
    }

    const subtreeMetadataModel: SubtreeMetadataModel = {
      schema: schema,
      tileMetadataModel: tileMetadataModel,
      tileIndexMapping: tileMetadataIndexMapping,
      contentMetadataModels: contentMetadataModels,
      contentIndexMappings: contentMetadataIndexMappings,
    };
    return subtreeMetadataModel;
  }

  /**
   * Computes the mapping of indices inside the availability
   * information to the number that says how many elements
   * have been available up to this index, if the element
   * at the respective index is available.
   *
   * Yes, that sounds complicated. But it is used for accessing
   * the metadata that is stored in the subtree (see the 3D Tiles
   * specification, "ImplicitTiling - Tile Metadata").
   *
   * Quote:
   * "If `i` available tiles occur before a particular tile, that
   * tile’s property values are stored at index `i` of each
   * property value array."
   *
   * This means that when the availability bitstream is
   * [1, 0, 1, 1, 0] then this method will return an array
   * [0, _, 1, 2, _].
   *
   * The value of the `_` entries will be set to `-1`.
   *
   * @param availabilityInfo - The `AvailabilityInfo`
   * @returns The index mapping
   */
  private static computeAvailabilityIndexingMapping(
    availabilityInfo: AvailabilityInfo
  ): number[] {
    const n = availabilityInfo.length;
    const indexMapping = new Array<number>(n);
    let index = 0;
    for (let i = 0; i < n; i++) {
      const available = availabilityInfo.isAvailable(i);
      if (available) {
        indexMapping[i] = index;
        index++;
      } else {
        indexMapping[i] = -1;
      }
    }
    return indexMapping;
  }
}
