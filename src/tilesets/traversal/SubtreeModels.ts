import path from "path";

import { defined } from "../../base";
import { Buffers } from "../../base";
import { ResourceResolver } from "../../base";
import { TreeCoordinates } from "../../base";

import { Subtree } from "../../structure";
import { TileImplicitTiling } from "../../structure";
import { Schema } from "../../structure";

import { BinarySubtreeData } from "../implicitTiling/BinarySubtreeData";
import { BinarySubtreeDataResolver } from "../implicitTiling/BinarySubtreeDataResolver";
import { ImplicitTilingError } from "../implicitTiling/ImplicitTilingError";
import { ImplicitTilings } from "../implicitTiling/ImplicitTilings";
import { SubtreeInfos } from "../implicitTiling/SubtreeInfos";

import { SubtreeModel } from "./SubtreeModel";
import { SubtreeMetadataModels } from "./SubtreeMetadataModels";
import { SubtreeMetadataModel } from "./SubtreeMetadataModel";

/**
 * Methods to resolve subtree information.
 *
 * The methods will resolve the data for a subtree, based on the template
 * URI from the implicit tiling and the root coordinates of the subtree,
 * and offer this information as `SubtreeModel` objects.
 *
 * @internal
 */
export class SubtreeModels {
  /**
   * Resolve the `SubtreeModel` for the subtree with the given root coordinates.
   *
   * This will substitute the given coordinates into the subtree template
   * URI from the given implicit tiling object. Then it will attempt to load
   * the subtree data from this URI. The resulting data will be used to
   * construct the `SubtreeModel` object.
   *
   * @param implicitTiling - The `TileImplicitTiling`
   * @param schema - The optional metadata schema
   * @param resourceResolver - The `ResourceResolver` for the subtree
   * files and buffers
   * @param coordinates - The root coordinates of the subtree
   * @returns The `SubtreeModel`
   * @throws ImplicitTilingError If the input was structurally invalid
   */
  static async resolve(
    implicitTiling: TileImplicitTiling,
    schema: Schema | undefined,
    resourceResolver: ResourceResolver,
    coordinates: TreeCoordinates
  ): Promise<SubtreeModel> {
    // Obtain the raw subtree data by resolving the data from
    // the URI that is created from the template URI and the
    // coordinates
    const subtreeUri = ImplicitTilings.substituteTemplateUri(
      implicitTiling.subdivisionScheme,
      implicitTiling.subtrees.uri,
      coordinates
    );
    if (!defined(subtreeUri)) {
      const message =
        `Could not substitute coordinates ${coordinates} in ` +
        `subtree template URI ${implicitTiling.subtrees.uri}`;
      throw new ImplicitTilingError(message);
    }
    const subtreeData = await resourceResolver.resolveData(subtreeUri);
    if (!subtreeData) {
      const message =
        `Could not resolve subtree URI ${subtreeUri} that was ` +
        `created from template URI ${implicitTiling.subtrees.uri} ` +
        `for coordinates ${coordinates}`;
      throw new ImplicitTilingError(message);
    }

    // Create the resource resolver that will be used
    // for resolving references (buffer URIs) relative
    // to the directory that contained the subtree data
    const subtreeDirectory = path.dirname(subtreeUri);
    const subtreeResourceResolver = resourceResolver.derive(subtreeDirectory);

    // If the subtree data was JSON, just parse it and
    // create a SubtreeModel from it
    const isJson = Buffers.isProbablyJson(subtreeData);
    if (isJson) {
      let subtreeJson: any;
      let subtree: Subtree;
      try {
        subtreeJson = Buffers.getJson(subtreeData);
        subtree = subtreeJson;
      } catch (error) {
        const message =
          `Could not parse subtree JSON from URI ${subtreeUri} that was ` +
          `created from template URI ${implicitTiling.subtrees.uri} ` +
          `for coordinates ${coordinates}`;
        throw new ImplicitTilingError(message);
      }

      const binarySubtreeData = await BinarySubtreeDataResolver.resolveFromJson(
        subtree,
        subtreeResourceResolver
      );
      const subtreeModel = SubtreeModels.create(
        binarySubtreeData,
        implicitTiling,
        schema
      );
      return subtreeModel;
    }

    // For SUBT (binary subtree data), create the SubtreeModel
    // from the whole buffer
    const isSubt = Buffers.getMagicString(subtreeData) === "subt";
    if (isSubt) {
      const binarySubtreeData =
        await BinarySubtreeDataResolver.resolveFromBuffer(
          subtreeData,
          subtreeResourceResolver
        );
      const subtreeModel = SubtreeModels.create(
        binarySubtreeData,
        implicitTiling,
        schema
      );
      return subtreeModel;
    }

    const message =
      `Subtree data from URI ${subtreeUri} that was created from ` +
      `template URI ${implicitTiling.subtrees.uri} for coordinates ` +
      `${coordinates} did neither contain JSON nor binary subtree data`;
    throw new ImplicitTilingError(message);
  }

  /**
   * Creates the `SubtreeModel` from the given binary subtree data
   *
   * @param binarySubtreeData - The binary subtree data
   * @param implicitTiling - The `TileImplicitTiling`
   * @param schema - The optional metadata schema
   * @returns The `SubtreeModel`
   * @throws ImplicitTilingError If the input was structurally invalid
   */
  private static create(
    binarySubtreeData: BinarySubtreeData,
    implicitTiling: TileImplicitTiling,
    schema: Schema | undefined
  ): SubtreeModel {
    const subtreeInfo = SubtreeInfos.create(binarySubtreeData, implicitTiling);
    let subtreeMetadataModel: SubtreeMetadataModel | undefined = undefined;
    if (schema) {
      subtreeMetadataModel = SubtreeMetadataModels.create(
        binarySubtreeData,
        subtreeInfo,
        schema
      );
    }
    const subtreeModel: SubtreeModel = {
      subtreeInfo: subtreeInfo,
      subtreeMetadataModel: subtreeMetadataModel,
    };
    return subtreeModel;
  }
}
