import { Content } from "../../structure";
import { Tile } from "../../structure";

import { Contents } from "./Contents";
import { TileTraversalCallback } from "./TileTraversalCallback";

/**
 * Utility methods related to tiles, given as `Tile` objects.
 *
 * @internal
 */
export class Tiles {
  /**
   * Obtains the contents from the given tile.
   *
   * This will either return a single-element array, when the tile
   * defined `tile.content`, or a multi-element array, when the tile
   * defined `tile.contents`, or an empty array, when the tile does
   * not have contents.
   *
   * @param tile - The `Tile`
   * @returns The contents
   */
  static getContents(tile: Tile): Content[] {
    if (tile.content) {
      return [tile.content];
    }
    if (tile.contents) {
      return tile.contents;
    }
    return [];
  }

  /**
   * Set the contents of the given tile.
   *
   * If the given array is empty, then the `content` and `contents`
   * of the tile will be deleted. If it has length 1, then this
   * content will become the `content` of the tile. Otherwise,
   * the given array is set as the `contents` of the tile.
   *
   * @param tile - The `Tile`
   * @param contents - The tile contents
   */
  static setContents(tile: Tile, contents: Content[]) {
    if (contents.length === 0) {
      delete tile.content;
      delete tile.contents;
    } else if (contents.length === 1) {
      tile.content = contents[0];
      delete tile.contents;
    } else {
      delete tile.content;
      tile.contents = contents;
    }
  }

  /**
   * Obtains the content URIs from the given tile.
   *
   * This will either return a single-element array, when the tile
   * defined `tile.content`, or a multi-element array, when the tile
   * defined `tile.contents`. It also takes into account the case
   * that the (legacy) `tile.content.url` property may have been
   * used. In this case, a warning will be printed, and the `url`
   * will be returned.
   *
   * @param tile - The `Tile`
   * @returns The content URIs
   */
  static getContentUris(tile: Tile): string[] {
    const contents = Tiles.getContents(tile);
    const contentUris: string[] = [];
    for (const content of contents) {
      const uri = Contents.getUri(content);
      if (uri) {
        contentUris.push(uri);
      }
    }
    return contentUris;
  }

  /**
   * Traverses a tile hierarchy, starting at the given `Tile`, and
   * calls the given callback at each step.
   *
   * This only traverses the explicit tile hierarchy that is
   * stored in the tileset JSON. It does not traverse implicit
   * tiles.
   *
   * The callback will receive the current stack of tiles (i.e. the
   * last element of the `tilePath` array is the currently visited
   * tile). Callers may NOT modify that array. The callback should
   * return whether the traversal should continue at the current
   * tile.
   *
   * @param tile - The `Tile` to start the traversal at
   * @param callback - The callback for the tile stack
   * @returns A promise that resolves when the traversal is finished
   */
  static async traverseExplicit(
    tile: Tile,
    callback: TileTraversalCallback
  ): Promise<void> {
    const stack: Tile[] = [];
    await Tiles.traverseExplicitInternal(tile, stack, callback);
  }

  /**
   * Internal method for `traverseExplicit`, called recursively.
   *
   * @param tile - The `Tile` to start the traversal at
   * @param stack - The current tile stack
   * @param callback - The callback for the tile stack
   */
  private static async traverseExplicitInternal(
    tile: Tile,
    stack: Tile[],
    callback: TileTraversalCallback
  ): Promise<void> {
    stack.push(tile);
    const visitChildren = await callback(stack);
    if (tile.children && visitChildren) {
      for (const child of tile.children) {
        await Tiles.traverseExplicitInternal(child, stack, callback);
      }
    }
    stack.pop();
  }
}
