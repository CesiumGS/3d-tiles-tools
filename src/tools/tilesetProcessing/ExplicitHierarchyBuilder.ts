import { Matrix4 } from "cesium";

import { Tile } from "../../structure";
import { Tileset } from "../../structure";
import { TraversedTile } from "../../tilesets";
import { Tiles } from "../../tilesets";

/**
 * Summary of the explicit hierarchy that was built from an
 * (implicit) tileset.
 */
export type ExplicitHierarchy = {
  /**
   * The root of the explicit tile hierarchy
   */
  root: Tile;

  /**
   * The total number of tiles in the explicit hierarchy
   */
  tileCount: number;

  /**
   * The number of tiles that were created from implicit tiling
   * (i.e. that did not appear in the input tileset JSON)
   */
  implicitTileCount: number;

  /**
   * The number of tiles that have at least one content
   */
  contentTileCount: number;

  /**
   * The maximum depth of the hierarchy, with the root at depth 0
   */
  maxDepth: number;

  /**
   * The URIs of all subtree files that were resolved during the
   * traversal. These files must not be copied to the output.
   */
  subtreeUris: string[];
};

/**
 * Methods to build an explicit tile hierarchy from a tileset that
 * uses implicit tiling.
 *
 * The traversal itself is performed by the `TraversedTile` classes
 * from the 3D Tiles tools. This class only assembles the resulting
 * `Tile` objects into a plain explicit hierarchy.
 */
export class ExplicitHierarchyBuilder {
  /**
   * Moves any legacy `3DTILES_implicit_tiling` extension objects
   * that are found in the explicit tiles of the given tileset into
   * the `tile.implicitTiling` property that is used in 3D Tiles 1.1.
   *
   * The legacy extension used `maximumLevel` instead of
   * `availableLevels`. This is converted accordingly.
   *
   * @param tileset - The tileset
   * @returns The number of tiles that were normalized
   */
  static normalizeLegacyImplicitTiling(tileset: Tileset): number {
    let count = 0;
    const stack: Tile[] = [tileset.root];
    while (stack.length > 0) {
      const tile = stack.pop() as Tile;
      const extensions = tile.extensions;
      const legacy = extensions?.["3DTILES_implicit_tiling"];
      if (legacy && !tile.implicitTiling) {
        const implicitTiling: any = { ...legacy };
        if (
          implicitTiling.availableLevels === undefined &&
          implicitTiling.maximumLevel !== undefined
        ) {
          implicitTiling.availableLevels = implicitTiling.maximumLevel + 1;
        }
        delete implicitTiling.maximumLevel;
        tile.implicitTiling = implicitTiling;
        delete extensions["3DTILES_implicit_tiling"];
        if (Object.keys(extensions).length === 0) {
          delete tile.extensions;
        }
        count++;
      }
      if (tile.children) {
        stack.push(...tile.children);
      }
    }
    return count;
  }

  /**
   * Builds an explicit tile hierarchy from the given traversed root.
   *
   * Implicit tiling roots lose their `implicitTiling` property and
   * their template content URI. All other tiles are created with
   * `TraversedTile.asFinalTile()`, so that metadata semantic
   * overrides (for example, `TILE_BOUNDING_BOX`) are already applied.
   *
   * @param traversedRoot - The traversed root tile
   * @returns The explicit hierarchy
   */
  static async build(traversedRoot: TraversedTile): Promise<ExplicitHierarchy> {
    const stats = {
      tileCount: 0,
      implicitTileCount: 0,
      contentTileCount: 0,
      maxDepth: 0,
      subtreeUris: new Set<string>(),
    };
    const root = await ExplicitHierarchyBuilder.buildTile(
      traversedRoot,
      0,
      false,
      stats
    );
    return {
      root: root,
      tileCount: stats.tileCount,
      implicitTileCount: stats.implicitTileCount,
      contentTileCount: stats.contentTileCount,
      maxDepth: stats.maxDepth,
      subtreeUris: [...stats.subtreeUris],
    };
  }

  private static async buildTile(
    traversedTile: TraversedTile,
    depth: number,
    insideImplicit: boolean,
    stats: {
      tileCount: number;
      implicitTileCount: number;
      contentTileCount: number;
      maxDepth: number;
      subtreeUris: Set<string>;
    }
  ): Promise<Tile> {
    const explicitTile = traversedTile.asFinalTile();

    const isImplicitRoot = traversedTile.isImplicitTilesetRoot();
    if (isImplicitRoot) {
      delete explicitTile.implicitTiling;
      delete explicitTile.content;
      delete explicitTile.contents;
      const extensions = explicitTile.extensions;
      if (extensions) {
        delete extensions["3DTILES_implicit_tiling"];
        if (Object.keys(extensions).length === 0) {
          delete explicitTile.extensions;
        }
      }
    }

    const subtreeUri = traversedTile.getSubtreeUri();
    if (subtreeUri !== undefined) {
      stats.subtreeUris.add(subtreeUri);
    }

    stats.tileCount++;
    if (insideImplicit) {
      stats.implicitTileCount++;
    }
    if (Tiles.getContents(explicitTile).length > 0) {
      stats.contentTileCount++;
    }
    stats.maxDepth = Math.max(stats.maxDepth, depth);

    const explicitChildren: Tile[] = [];
    const children = await traversedTile.getChildren();
    for (const child of children) {
      const explicitChild = await ExplicitHierarchyBuilder.buildTile(
        child,
        depth + (isImplicitRoot ? 0 : 1),
        insideImplicit || isImplicitRoot,
        stats
      );
      explicitChildren.push(explicitChild);
    }

    // The traversal models the implicit root as an explicit tile with a
    // single child for the level-0 implicit tile. In the specification,
    // these are the same tile, so merge the level-0 tile back into the
    // explicit one: the explicit tile keeps its transform and other
    // properties, and receives the content, bounding volume, and
    // children of the level-0 tile.
    if (isImplicitRoot && explicitChildren.length === 1) {
      const level0 = explicitChildren[0];
      explicitTile.boundingVolume = level0.boundingVolume;
      // The level-0 values equal those of the explicit tile unless a
      // metadata semantic (TILE_GEOMETRIC_ERROR, TILE_REFINE, ...)
      // overrode them, so they take precedence
      explicitTile.geometricError = level0.geometricError;
      if (level0.refine) {
        explicitTile.refine = level0.refine;
      }
      if (level0.transform) {
        explicitTile.transform = explicitTile.transform
          ? Matrix4.toArray(
              Matrix4.multiply(
                Matrix4.fromArray(explicitTile.transform),
                Matrix4.fromArray(level0.transform),
                new Matrix4()
              )
            )
          : level0.transform;
      }
      if (level0.content) {
        explicitTile.content = level0.content;
      }
      if (level0.contents) {
        explicitTile.contents = level0.contents;
      }
      if (level0.metadata) {
        explicitTile.metadata = level0.metadata;
      }
      if (level0.children && level0.children.length > 0) {
        explicitTile.children = level0.children;
      } else {
        delete explicitTile.children;
      }
      // The level-0 tile was already counted, including its content
      stats.tileCount--;
      stats.implicitTileCount--;
      return explicitTile;
    }

    if (explicitChildren.length > 0) {
      explicitTile.children = explicitChildren;
    } else {
      delete explicitTile.children;
    }
    return explicitTile;
  }
}
