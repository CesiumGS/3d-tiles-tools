import { PropertyTableModel } from "../metadata/PropertyTableModel";
import { Schema } from "../structure/Metadata/Schema";

/**
 * An interface summarizing the metadata that may be associated
 * with a subtree.
 *
 * (Note: One could consider to offer something like this in the
 * `implicitTiling` package, alongside the `SubtreeInfo`. But
 * the structure of this interface is too much tailored for
 * its use in the traversal right now)
 *
 * @internal
 */
export interface SubtreeMetadataModel {
  /**
   * The schema to which this metadata complies
   */
  schema: Schema;

  /**
   * The tile metadata.
   *
   * This is the property table that is indexed via `subtree.tileMetadata`
   * in the array of property tables that are defined by the subtree
   * (or `undefined` when the subtree does not have tile metadata)
   */
  tileMetadataModel: PropertyTableModel | undefined;

  /**
   * The mapping from tile indices to the rows of the
   * tileMetadataModel that contain the metadata for
   * the respective tile.
   *
   * (See SubtreeMetadataModels.computeAvailabilityIndexingMapping
   * for details)
   */
  tileIndexMapping: number[] | undefined;

  /**
   * The content metadata.
   *
   * These are the property tables that are indexed via `subtree.contentMetadata`
   * in the array of property tables that are defined by the subtree, or
   * the empty array when the subtree does not have content metadata.
   */
  contentMetadataModels: PropertyTableModel[];

  /**
   * The mappings from content indices to the rows of the
   * contentMetadataModels that contain the metadata for
   * the respective content.
   *
   * (See SubtreeMetadataModels.computeAvailabilityIndexingMapping
   * for details)
   */
  contentIndexMappings: number[][];
}
