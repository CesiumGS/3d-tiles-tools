import { Tileset } from "../../structure";
import { Tile } from "../../structure";
import { Content } from "../../structure";

import { DeveloperError, Loggers } from "../../base";
const logger = Loggers.get("tilesetProcessing");

/**
 * Internal type definition for the state of traversing the
 * tile hierarchy
 *
 * @internal
 */
type SplittingState = {
  /**
   * The root tileset where the traversal started
   */
  rootTileset: Tileset;

  /**
   * The global level of the current traversal, referring to the
   * root tileset, where the rootTileset.root has globalLevel of 0.
   */
  globalLevel: number;

  /**
   * The tileset that contained the tile that is currently
   * traversed. This may be a tileset that was created
   * by converting one of the original tiles into an external
   * tileset.
   */
  currentTileset: Tileset;

  /**
   * The local level of the traversal, referring to the current
   * tileset, where currentTileset.root has a localLevel of 0
   */
  localLevel: number;

  /**
   * The currently active 'refine' strategy.
   */
  currentRefine: string;

  /**
   * A mapping from URls to the external tilesets that have been
   * created so far
   */
  externalTilesets: Map<string, Tileset>;
};

/**
 * An interface for classes that can decide whether a given tile should
 * be converted into an external tileset.
 *
 * @internal
 */
interface SplittingCondition {
  /**
   * Returns whether the given tile should be converted into an external
   * tileset.
   *
   * @param tile - The tile
   * @param splittingState - The splitting state
   */
  shouldExternalize(tile: Tile, splittingState: SplittingState): boolean;
}

/**
 * A class that can split a tileset into one that refers to multiple
 * external tilesets.
 *
 * @internal
 */
export class TilesetSplitter {
  /**
   * The condition that decides whether a certain tile should be converted
   * into an external tileset.
   */
  private splittingCondition: SplittingCondition;

  /**
   * Creates a new instance.
   *
   * This instance does not have a splitting condition by default, meaning
   * that it will not actually split the tileset. Use
   * `setGlobalSplittingLevels` to configure the splitting condition.
   */
  constructor() {
    this.splittingCondition = {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      shouldExternalize(tile: Tile, splittingState: SplittingState): boolean {
        return false;
      },
    };
  }

  /**
   * Set the array that indicates at which global levels the tileset should
   * be split.
   *
   * For example, for a tileset with 9 levels, calling this with
   * `globalSplittingLevels = [2, 5]`
   * will split the tileset as follows:
   * ```
   * level   input  outputs
   * 0       root   root
   * 1       T1     T1
   * 2       T2     T2     root
   * 3       T3            T3
   * 4       T4            T4
   * 5       T5            T5     root
   * 6       T6                   T6
   * 7       T7                   T7
   * 8       T8                   T8
   * ```
   *
   * @param globalSplittingLevels - The splitting levels
   * @throws DeveloperError If any of the splitting levels is not positive
   * or they are not strictly increasing
   */
  setGlobalSplittingLevels(globalSplittingLevels: number[]) {
    TilesetSplitter.validateSplittingLevels(globalSplittingLevels);
    this.splittingCondition = {
      shouldExternalize(tile: Tile, splittingState: SplittingState): boolean {
        return globalSplittingLevels.includes(splittingState.globalLevel);
      },
    };
  }

  /**
   * Ensure that the given array only contains positive, strictly
   * increasing values
   *
   * @param array - The array
   * @throws DeveloperError If this is not the case
   */
  private static validateSplittingLevels(array: number[]) {
    for (let i = 0; i < array.length; i++) {
      const nonPositive = array[i] <= 0;
      const nonIncreasing = i > 0 && array[i] <= array[i - 1];
      if (nonPositive || nonIncreasing) {
        throw new DeveloperError(
          `The splitting levels must all be positive ` +
            `and strictly increasing, but are ${array}`
        );
      }
    }
  }

  /**
   * Split the given tileset, in place.
   *
   * This will convert tiles of the given tileset into external tilesets,
   * based on the splitting condition of this instance.
   *
   * @param tileset - The tileset
   * @returns The result
   */
  splitTileset(tileset: Tileset): Map<string, Tileset> {
    logger.info(`Splitting tileset...`);
    const refine = tileset.root.refine ?? "ADD";
    const splittingState: SplittingState = {
      rootTileset: tileset,
      globalLevel: 0,
      currentTileset: tileset,
      localLevel: 0,
      currentRefine: refine,
      externalTilesets: new Map<string, Tileset>(),
    };
    this.splitTilesetInternal(splittingState);
    const result = splittingState.externalTilesets;
    logger.info(
      `Splitting tileset DONE, created ${result.size} external tilesets`
    );
    return result;
  }

  /**
   * Internal entry point for the traversal that splits the current tileset
   * of the given splitting state.
   *
   * @param splittingState - The splitting state
   */
  private splitTilesetInternal(splittingState: SplittingState) {
    const root = splittingState.currentTileset.root;
    this.processTile(root, splittingState);
  }

  /**
   * Recursively process the given tile and its descendants, and convert
   * tiles into external tilesets based on the splitting condition.
   *
   * When the splitting condition indicates that a tile should be
   * externalized, then it will be converted into the root of an
   * external tileset, and the tiles of this external tileset will
   * be processed recursively.
   *
   * @param tile - The tile
   * @param splittingState - The splitting state
   */
  private processTile(tile: Tile, splittingState: SplittingState) {
    const children = tile.children;
    if (!children) {
      return;
    }
    const newChildren: Tile[] = [];
    const splittingCondition = this.splittingCondition;
    for (const child of children) {
      // If a child meets the splitting condition, then it will be
      // converted into a new child that refers to a newly created
      // external tileset (and the tiles of this external tileset
      // will be traversed recursively). Otherwise, the original
      // child is kept, and it descendants are traversed.
      const childSplittingState: SplittingState = {
        rootTileset: splittingState.rootTileset,
        globalLevel: splittingState.globalLevel + 1,
        currentTileset: splittingState.currentTileset,
        localLevel: splittingState.localLevel + 1,
        currentRefine: splittingState.currentRefine,
        externalTilesets: splittingState.externalTilesets,
      };
      const shouldExternalize = splittingCondition.shouldExternalize(
        child,
        childSplittingState
      );
      if (shouldExternalize) {
        const newChild = this.convertTileToExternalTileset(
          child,
          childSplittingState
        );
        newChildren.push(newChild);
      } else {
        this.processTile(child, childSplittingState);
        newChildren.push(child);
      }
    }
    tile.children = newChildren;
  }

  /**
   * Create a new tileset from the given tile, and return a new tile that refers
   * to this external tileset.
   *
   * The given tile will be used for creating the root of the new tileset.
   * The resulting tileset will be stored in the `externalTilesets` of the
   * splitting state. A new child will be returned that has a content with
   * a URI that refers to this newly created tileset.
   *
   * @param tile - The tile
   * @param splittingState - The splitting state
   * @returns The new child
   */
  private convertTileToExternalTileset(
    tile: Tile,
    splittingState: SplittingState
  ) {
    // Create the external tileset from the tile, and store it
    // in the map of external tilesets
    const newChildTileset = TilesetSplitter.createTilesetFrom(
      tile,
      splittingState
    );
    const uri = TilesetSplitter.deriveExternalTilesetJsonUri(
      tile,
      splittingState
    );
    const externalTilesets = splittingState.externalTilesets;
    externalTilesets.set(uri, newChildTileset);

    // Traverse the external tileset, possibly splitting it even further
    const externalSplittingState: SplittingState = {
      rootTileset: splittingState.rootTileset,
      globalLevel: splittingState.globalLevel,
      currentTileset: newChildTileset,
      localLevel: 0,
      currentRefine: splittingState.currentRefine,
      externalTilesets: splittingState.externalTilesets,
    };
    this.splitTilesetInternal(externalSplittingState);

    // Return the new tile that refers to the external tileset
    const newContent: Content = {
      uri: uri,
    };
    const newChild: Tile = {
      refine: splittingState.currentRefine,
      content: newContent,
      boundingVolume: tile.boundingVolume,
      geometricError: tile.geometricError,
    };
    return newChild;
  }

  /**
   * Create a new tileset from the given tile.
   *
   * This will create a new tileset where the properties of the root tile
   * are set based on the properties of the given tile.
   *
   * @param tile - The tile
   * @param splittingState - The splitting state
   * @returns The tileset
   */
  private static createTilesetFrom(
    tile: Tile,
    splittingState: SplittingState
  ): Tileset {
    const refine = tile.refine ?? splittingState.currentRefine;
    const newRoot: Tile = {
      refine: refine,
      content: tile.content,
      contents: tile.contents,
      boundingVolume: tile.boundingVolume,
      geometricError: tile.geometricError,
      children: tile.children,
    };
    const newChildTileset: Tileset = {
      asset: {
        version: "1.1",
      },
      geometricError: tile.geometricError,
      root: newRoot,
      extensionsUsed: splittingState.rootTileset.extensionsUsed,
      extensionsRequired: splittingState.rootTileset.extensionsRequired,
    };
    return newChildTileset;
  }

  /**
   * Create a URI that should be used for the external tileset that is
   * created for the given tile.
   *
   * @param tile - The tile
   * @param splittingState - The splitting state
   * @returns The URI
   */
  private static deriveExternalTilesetJsonUri(
    tile: Tile,
    splittingState: SplittingState
  ): string {
    const extensions = tile.boundingVolume.extensions ?? {};
    const s2 = extensions["3DTILES_bounding_volume_S2"];
    const token = s2?.token;
    if (token) {
      return "external-" + token + ".json";
    }
    const n = splittingState.externalTilesets.size;
    return "external-level-" + splittingState.globalLevel + "-" + n + ".json";
  }
}
