import { ResourceResolver } from "../io/ResourceResolver";

import { Tileset } from "../structure/Tileset";
import { Schema } from "../structure/Metadata/Schema";

import { TraversedTile } from "./TraversedTile";
import { ExplicitTraversedTile } from "./ExplicitTraversedTile";
import { TraversalCallback } from "./TraversalCallback";

import { DeveloperError } from "../base/DeveloperError";
import { DataError } from "../base/DataError";

import { LazyContentData } from "../contentTypes/LazyContentData";
import { ContentDataTypeRegistry } from "../contentTypes/ContentDataTypeRegistry";

/**
 * A class that can traverse the tiles of a tileset.
 *
 * @internal
 */
export class TilesetTraverser {
  /**
   * Traverses the tiles in the given tileset.
   *
   * This will traverse the tiles of the given tileset, starting
   * at the root. It will pass all tiles to the given callback,
   * as `TraversedTile` instances.
   *
   * @param tileset - The `Tileset`
   * @param schema - The schema from the `tileset.schema` or the
   * `tileset.schemaUri`. If this is defined, then it is assumed
   * to be a valid schema definition.
   * @param resourceResolver - The `ResourceResolver` that is used to
   * resolve resources for implicit tilesets (subtree files) or
   * external tilesets.
   * @param traversalCallback - The `TraversalCallback`
   * @param depthFirst - Whether the traversal should be depth-first
   * @param traverseExternalTilesets - Whether external tileset should be
   * traversed
   * @returns A Promise that resolves when the traversal finished
   */
  static async traverse(
    tileset: Tileset,
    schema: Schema | undefined,
    resourceResolver: ResourceResolver,
    traversalCallback: TraversalCallback,
    depthFirst: boolean,
    traverseExternalTilesets: boolean
  ): Promise<void> {
    const root = tileset.root;
    if (!root) {
      return;
    }
    const stack: TraversedTile[] = [];

    const traversedRoot = new ExplicitTraversedTile(
      root,
      "/root",
      0,
      undefined,
      schema,
      resourceResolver
    );
    stack.push(traversedRoot);

    while (stack.length > 0) {
      const traversedTile = depthFirst ? stack.pop() : stack.shift();
      if (!traversedTile) {
        // This cannot happen, but TypeScript does not know this:
        throw new DeveloperError("Empty stack during traversal");
      }
      const traverseChildren = await traversalCallback(traversedTile);

      if (traverseChildren) {
        const children = await traversedTile.getChildren();
        const length = children.length;

        if (length !== 0) {
          // When there are children, traverse them directly
          for (let i = 0; i < length; i++) {
            const traversedChild = children[i];
            stack.push(traversedChild);
          }
        } else if (traverseExternalTilesets) {
          // When there are no children, but external tilesets should
          // be traversed, determine the roots of external tilesets
          // and put them on the traversal stack
          const externalRoots =
            await TilesetTraverser.createExternalTilesetRoots(
              traversedTile,
              resourceResolver
            );
          for (let i = 0; i < externalRoots.length; i++) {
            const externalRoot = externalRoots[i];
            stack.push(externalRoot);
          }
        }
      }
    }
  }

  /**
   *
   * @param traversedTile - The `TraversedTile`
   * @param resourceResolver The `ResourceResolver` for the
   * external tileset JSON and related files
   * @returns The external tileset roots
   * @throws DataError If one of the externa tilesets or
   * its associated files could not be resolved.
   */
  private static async createExternalTilesetRoots(
    traversedTile: TraversedTile,
    resourceResolver: ResourceResolver
  ) {
    if (traversedTile.isImplicitTilesetRoot()) {
      return [];
    }
    const contents = traversedTile.getRawContents();
    if (contents.length === 0) {
      return [];
    }
    const externalRoots: TraversedTile[] = [];
    for (const content of contents) {
      // Check if the the content is an external tileset
      const contentUri = content.uri;
      const contentData = new LazyContentData(contentUri, resourceResolver);
      const contentDataType = await ContentDataTypeRegistry.findContentDataType(
        contentData
      );
      const isTileset = contentDataType === "CONTENT_TYPE_TILESET";

      if (isTileset) {
        // If an external tileset was found, parse it, derive
        // a resource resolver for its base directory, obtain
        // its metadata schema, and create an explicit traversed
        // tile for its root.
        const externalTileset = await contentData.getParsedObject();
        const derivedResourceResolver = resourceResolver.derive(contentUri);
        const externalSchema = await TilesetTraverser.resolveSchema(
          externalTileset,
          derivedResourceResolver
        );
        const externalRoot = new ExplicitTraversedTile(
          externalTileset.root,
          traversedTile.path + `/[external:${contentUri}]/root`,
          traversedTile.level + 1,
          traversedTile,
          externalSchema,
          derivedResourceResolver
        );
        externalRoots.push(externalRoot);
      }
    }
    return externalRoots;
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
  private static async resolveSchema(
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
