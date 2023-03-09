import { defined } from "../base/defined";

import { Tile } from "../structure/Tile";

import { MetadataEntityModel } from "../metadata/MetadataEntityModel";

/**
 * Methods for overriding properties in `Tile` and `Content` objects,
 * based on metadata semantics.
 *
 * @internal
 */
export class MetadataSemanticOverrides {
  /**
   * Applies all overrides to the given tile, based in the property
   * values that are found in the given metadata entity model.
   *
   * @param tile - The tile that will be modified
   * @param metadataEntityModel - The `MetadataEntityModel`
   */
  static applyToTile(tile: Tile, metadataEntityModel: MetadataEntityModel) {
    // Apply the semantic-based overrides from the metadata
    const semanticBoundingBox =
      metadataEntityModel.getPropertyValueBySemantic("TILE_BOUNDING_BOX");
    if (semanticBoundingBox) {
      tile.boundingVolume.box = semanticBoundingBox;
    }

    const semanticBoundingRegion =
      metadataEntityModel.getPropertyValueBySemantic("TILE_BOUNDING_REGION");
    if (semanticBoundingRegion) {
      tile.boundingVolume.region = semanticBoundingRegion;
    }

    const semanticBoundingSphere =
      metadataEntityModel.getPropertyValueBySemantic("TILE_BOUNDING_SPHERE");
    if (semanticBoundingSphere) {
      tile.boundingVolume.sphere = semanticBoundingSphere;
    }

    const semanticGeometricError =
      metadataEntityModel.getPropertyValueBySemantic("TILE_GEOMETRIC_ERROR");
    if (defined(semanticGeometricError)) {
      tile.geometricError = semanticGeometricError as number;
    }

    const semanticRefine =
      metadataEntityModel.getPropertyValueBySemantic("TILE_REFINE");
    if (semanticRefine === 0) {
      tile.refine = "ADD";
    } else if (semanticRefine === 1) {
      tile.refine = "REPLACE";
    }

    const semanticTransform =
      metadataEntityModel.getPropertyValueBySemantic("TILE_TRANSFORM");
    if (semanticTransform) {
      tile.transform = semanticTransform;
    }
  }
}
