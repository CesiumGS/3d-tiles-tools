import path from "path";

import { ResourceResolver } from "../../base";
import { DataError } from "../../base";
import { LazyContentData } from "../../base";
import { ContentDataTypeRegistry } from "../../base";
import { ContentDataTypes } from "../../base";
import { Paths } from "../../base";

import { Tileset } from "../../structure";
import { Schema } from "../../structure";

import { TilesetSourceResourceResolver } from "../tilesetData/TilesetSourceResourceResolver";

import { TraversedTile } from "./TraversedTile";
import { ExplicitTraversedTile } from "./ExplicitTraversedTile";

import { TilesetSource3tz } from "../packages/TilesetSource3tz";

import { Loggers } from "../../base";
const logger = Loggers.get("traversal");

/**
 * Internal utility methods for tileset traversal, used for
 * the `TilesetTraverser` implementation.
 *
 * @internal
 */
export class TilesetTraversers {
  /**
   * Create the nodes that are the roots of external tilesets
   * that are referred to by the given traversed tile.
   *
   * If the given tile does not have any contents or none of
   * them refers to a tileset, then an empty array is returned.
   *
   * @param baseUri - The URI against which content URI are resolved
   * in order to obtain an absolute URI. This is only used for the case
   * of package (3TZ or 3DTILES) content, to create a `TilesetSource`
   * from the absolute URI.
   * @param traversedTile - The `TraversedTile`
   * @returns The external tileset roots
   * @throws DataError If one of the externa tilesets or
   * its associated files could not be resolved.
   */
  static async createExternalTilesetRoots(
    baseUri: string,
    traversedTile: TraversedTile
  ): Promise<TraversedTile[]> {
    if (traversedTile.isImplicitTilesetRoot()) {
      return [];
    }
    const contents = traversedTile.getRawContents();
    if (contents.length === 0) {
      return [];
    }

    const resourceResolver = traversedTile.getResourceResolver();

    const externalRoots: TraversedTile[] = [];
    for (const content of contents) {
      const contentUri = content.uri;

      // Try to obtain an external tileset from the content
      const externalTilesetContext =
        await TilesetTraversers.resolveExternalTilesetContext(
          baseUri,
          contentUri,
          resourceResolver
        );

      if (externalTilesetContext) {
        const externalTileset = externalTilesetContext.tileset;
        const externalResourceResolver =
          externalTilesetContext.resourceResolver;

        // If an external tileset was found, resolve its schema,
        // and create an explicit traversed tile for its root.
        const externalSchema = await TilesetTraversers.resolveSchema(
          externalTileset,
          externalResourceResolver
        );
        const externalRoot = new ExplicitTraversedTile(
          externalTileset.root,
          traversedTile.path + `/[external:${contentUri}]/root`,
          traversedTile.level + 1,
          traversedTile,
          externalSchema,
          externalResourceResolver
        );
        externalRoots.push(externalRoot);
      }
    }
    return externalRoots;
  }

  /**
   * Fetch the information that is required for creating the root
   * nodes of external tilesets from the given URI.
   *
   * If the given URI does not refer to an external tileset,
   * then `undefined` is returned.
   *
   * Otherwise, it will return the parsed `Tileset` object,
   * and the `ResourceResolver` that can be used to resolve
   * resources from this tileset.
   *
   * @param baseUri - The URI against which the given URI is resolved
   * in order to obtain an absolute URI. This is only used for the case
   * of package (3TZ or 3DTILES) content, to create a `TilesetSource`
   * from the absolute URI.
   * @param uri - The URI
   * @param resourceResolver - The `ResourceResolver`
   * @returns The tileset
   * @throws DataError If an external tileset could not be
   * resolved or parsed.
   */
  private static async resolveExternalTilesetContext(
    baseUri: string,
    uri: string,
    resourceResolver: ResourceResolver
  ): Promise<
    { tileset: Tileset; resourceResolver: ResourceResolver } | undefined
  > {
    const contentData = new LazyContentData(uri, resourceResolver);
    const contentDataType = await ContentDataTypeRegistry.findContentDataType(
      contentData
    );
    const isTileset = contentDataType === ContentDataTypes.CONTENT_TYPE_TILESET;

    // For external tileset JSON files, just return the parsed
    // tileset and a resource resolver that resolves against
    // the base directory of the tileset JSON file
    if (isTileset) {
      const externalTileset = await contentData.getParsedObject();
      const basePath = path.dirname(uri);
      const externalResourceResolver = resourceResolver.derive(basePath);
      const result = {
        tileset: externalTileset,
        resourceResolver: externalResourceResolver,
      };
      return result;
    }

    // For tileset packages, create a `TilesetSource`, extract
    // the `Tileset` object from its `tileset.json` file,
    // and return the `Tileset` and a resource resolver that
    // resolves against the tileset source.
    const isPackage = contentDataType === ContentDataTypes.CONTENT_TYPE_3TZ;
    if (isPackage) {
      const absoluteUri = Paths.join(baseUri, uri);
      const externalTilesetSource = new TilesetSource3tz();
      const tilesetJsonFileName = "tileset.json";
      // XXX TODO There is no matching 'close' call for this!
      try {
        externalTilesetSource.open(absoluteUri);
      } catch (e) {
        logger.warn(
          `Could not open external tileset from ${absoluteUri} - ignoring`
        );
        return undefined;
      }
      let externalTileset;
      const tilesetJsonData =
        externalTilesetSource.getValue(tilesetJsonFileName);
      if (!tilesetJsonData) {
        throw new DataError(`Could not resolve ${tilesetJsonFileName}`);
      }
      try {
        externalTileset = JSON.parse(tilesetJsonData.toString("utf-8"));
      } catch (e) {
        throw new DataError(
          `Could not parse tileset from ${tilesetJsonFileName}`
        );
      }
      const externalResourceResolver = new TilesetSourceResourceResolver(
        ".",
        externalTilesetSource
      );
      const result = {
        tileset: externalTileset,
        resourceResolver: externalResourceResolver,
      };
      return result;
    }
    return undefined;
  }

  /**
   * Resolve the `Schema` for the given tileset.
   *
   * This is either the `tileset.schema`, or the schema that is
   * obtained from the `tileset.schemaUri`, or `undefined` if
   * neither of them are present.
   *
   * @param tileset - The tileset
   * @param resourceResolver - The `ResourceResolver` for loading
   * the schema from the `schemaUri` if necessary
   * @returns The `Schema`, or `undefined` if there is none
   * @throws DataError If the schema from the `schemaUri`
   * could not be resolved or parsed.
   */
  static async resolveSchema(
    tileset: Tileset,
    resourceResolver: ResourceResolver
  ): Promise<Schema | undefined> {
    if (tileset.schema) {
      return tileset.schema;
    }
    if (tileset.schemaUri) {
      const uri = tileset.schemaUri;
      const schemaData = await resourceResolver.resolveData(uri);
      if (!schemaData) {
        throw new DataError(`Could not resolve ${uri}`);
      }
      try {
        const schema = JSON.parse(schemaData.toString("utf-8"));
        return schema;
      } catch (e) {
        throw new DataError(`Could not parse schema from ${uri}`);
      }
    }
    return undefined;
  }
}
