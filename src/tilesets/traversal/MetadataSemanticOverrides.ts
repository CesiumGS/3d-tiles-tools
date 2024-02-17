import { defined } from "../../base";

import { Tile } from "../../structure";
import { Content } from "../../structure";
import { Schema } from "../../structure";

import { MetadataEntityModel } from "../../metadata";
import { MetadataEntityModels } from "../../metadata";

import { SubtreeMetadataModel } from "./SubtreeMetadataModel";

import { ImplicitTilingError } from "../implicitTiling/ImplicitTilingError";

/**
 * Methods for overriding properties in `Tile` and `Content` objects,
 * based on metadata semantics.
 *
 * @internal
 */
export class MetadataSemanticOverrides {
  // TODO There are far too few error checks (e.g. for invalid
  // indices) here. This COULD be delegated to the assumption
  // that the input is "valid" (as determined by the validator),
  // but the error handling here should still be improved.

  /**
   * Perform the overrides of the properties of the given tile that
   * are given by metadata semantics.
   *
   * If the given tile contains a `MetadataEntity`, then the property
   * values of that metadata entity are examined. The property values
   * that have a semantic will be used to override the corresponding
   * values in the given tile.
   *
   * For example, when the metadata entity has a property with the
   * semantic `TILE_GEOMETRIC_ERROR`, then the `geometricError` in
   * the given tile will be replaced with the corresponding value
   * from the metadata entity.
   *
   * @param tile - The tile
   * @param schema - The metadata schema
   * @throws ImplicitTilingError If the input (for example, the
   * schema and the metadata entity) are not structurally valid.
   */
  static applyExplicitTileMetadataSemanticOverrides(
    tile: Tile,
    schema: Schema
  ) {
    const metadata = tile.metadata;
    if (!metadata) {
      return;
    }
    let metadataEntityModel: MetadataEntityModel | undefined = undefined;
    try {
      metadataEntityModel = MetadataEntityModels.create(schema, metadata);
    } catch (error) {
      const message = `Error while traversing tileset: ${error}`;
      throw new ImplicitTilingError(message);
    }
    MetadataSemanticOverrides.applyToTile(tile, metadataEntityModel);
  }

  /**
   * Perform the overrides of the properties of the given content that
   * are given by metadata semantics.
   *
   * If the given content contains `MetadataEntity`, then the property
   * values of that metadata entity are examined. The property values
   * that have a semantic will be used to override the corresponding
   * values in the given content.
   *
   * @param content - The content
   * @param schema - The metadata schema
   * @throws ImplicitTilingError If the input (for example, the
   * schema and the metadata entity) are not structurally valid.
   */
  static applyExplicitContentMetadataSemanticOverrides(
    content: Content,
    schema: Schema
  ) {
    const metadata = content.metadata;
    if (!metadata) {
      return;
    }

    let metadataEntityModel: MetadataEntityModel | undefined = undefined;
    try {
      metadataEntityModel = MetadataEntityModels.create(schema, metadata);
    } catch (error) {
      const message = `Error while traversing tileset: ${error}`;
      throw new ImplicitTilingError(message);
    }
    MetadataSemanticOverrides.applyToContent(content, metadataEntityModel);
  }

  /**
   * Perform the overrides of the properties of the given tile that
   * are given by metadata semantics.
   *
   * If the given subtreeMetadataModel contains tile metadata, then
   * the values of the metadata entity for the given tile are examined.
   * The property values that have a semantic will be used to override
   * the corresponding values in the given tile.
   *
   * @param tile - The tile
   * @param tileIndex - The tile index (referring to availability indexing)
   * @param subtreeMetadataModel - The `SubtreeMetadataModel`
   * @throws ImplicitTilingError If the input (for example, the
   * schema and the metadata entity) are not structurally valid.
   */
  static applyImplicitTileMetadataSemanticOverrides(
    tile: Tile,
    tileIndex: number,
    subtreeMetadataModel: SubtreeMetadataModel
  ) {
    if (
      subtreeMetadataModel.tileMetadataModel &&
      subtreeMetadataModel.tileIndexMapping
    ) {
      const metadataIndex = subtreeMetadataModel.tileIndexMapping[tileIndex];
      const tileMetadataModel = subtreeMetadataModel.tileMetadataModel;
      const metadataEntityModel =
        tileMetadataModel.getMetadataEntityModel(metadataIndex);
      MetadataSemanticOverrides.applyToTile(tile, metadataEntityModel);
    }
  }

  /**
   * Perform the overrides of the properties of the given content that
   * are given by metadata semantics.
   *
   * If the given subtreeMetadataModel contains content metadata, then
   * the values of the metadata entity for the given content are examined.
   * The property values that have a semantic will be used to override
   * the corresponding values in the given content.
   *
   * @param content - The content
   * @param contentSetIndex - The content set index, which is `0` for
   * single contents, `0` or `1` for two contents, and so on.
   * @param tileIndex - The tile index (referring to availability indexing)
   * @param subtreeMetadataModel - The `SubtreeMetadataModel`
   * @throws ImplicitTilingError If the input (for example, the
   * schema and the metadata entity) are not structurally valid.
   */
  static applyImplicitContentMetadataSemanticOverrides(
    content: Content,
    contentSetIndex: number,
    tileIndex: number,
    subtreeMetadataModel: SubtreeMetadataModel
  ) {
    if (
      subtreeMetadataModel.contentMetadataModels &&
      subtreeMetadataModel.contentIndexMappings &&
      contentSetIndex < subtreeMetadataModel.contentMetadataModels.length
    ) {
      const metadataIndex =
        subtreeMetadataModel.contentIndexMappings[contentSetIndex][tileIndex];
      const contentMetadataModel =
        subtreeMetadataModel.contentMetadataModels[contentSetIndex];
      const metadataEntityModel =
        contentMetadataModel.getMetadataEntityModel(metadataIndex);
      MetadataSemanticOverrides.applyToContent(content, metadataEntityModel);
    }
  }

  /**
   * Applies all overrides to the given tile, based in the property
   * values that are found in the given metadata entity model.
   *
   * @param tile - The tile that will be modified
   * @param metadataEntityModel - The `MetadataEntityModel`
   */
  private static applyToTile(
    tile: Tile,
    metadataEntityModel: MetadataEntityModel
  ) {
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
      tile.geometricError = semanticGeometricError;
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

  /**
   * Applies all overrides to the given content, based in the property
   * values that are found in the given metadata entity model.
   *
   * @param content - The content that will be modified
   * @param metadataEntityModel - The `MetadataEntityModel`
   */
  private static applyToContent(
    content: Content,
    metadataEntityModel: MetadataEntityModel
  ) {
    const semanticBoundingBox = metadataEntityModel.getPropertyValueBySemantic(
      "CONTENT_BOUNDING_BOX"
    );
    if (semanticBoundingBox) {
      if (!content.boundingVolume) {
        content.boundingVolume = {};
      }
      content.boundingVolume.box = semanticBoundingBox;
    }

    const semanticBoundingRegion =
      metadataEntityModel.getPropertyValueBySemantic("CONTENT_BOUNDING_REGION");
    if (semanticBoundingRegion) {
      if (!content.boundingVolume) {
        content.boundingVolume = {};
      }
      content.boundingVolume.region = semanticBoundingRegion;
    }

    const semanticBoundingSphere =
      metadataEntityModel.getPropertyValueBySemantic("CONTENT_BOUNDING_SPHERE");
    if (semanticBoundingSphere) {
      if (!content.boundingVolume) {
        content.boundingVolume = {};
      }
      content.boundingVolume.sphere = semanticBoundingSphere;
    }

    const semanticUri =
      metadataEntityModel.getPropertyValueBySemantic("CONTENT_URI");
    if (defined(semanticUri)) {
      content.uri = semanticUri;
    }

    const semanticGroupId =
      metadataEntityModel.getPropertyValueBySemantic("CONTENT_GROUP_ID");
    if (defined(semanticGroupId)) {
      content.group = semanticGroupId;
    }
  }
}
