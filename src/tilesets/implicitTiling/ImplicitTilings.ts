import { TreeCoordinates } from "../../base";
import { Quadtrees } from "../../base";
import { QuadtreeCoordinates } from "../../base";
import { Octrees } from "../../base";
import { OctreeCoordinates } from "../../base";

import { TileImplicitTiling } from "../../structure";

import { TemplateUris } from "./TemplateUris";
import { ImplicitTilingError } from "./ImplicitTilingError";

/**
 * Utility methods related to `TileImplicitTiling` instances.
 *
 * Preliminary!
 *
 * The purpose of these methods is mainly to hide the differences
 * between `QUADTREE` and `OCTREE` subdivision schemes. It is
 * possible to completely hide these differences with the
 * appropriate abstractions. But the resulting structures may
 * involve interfaces that have to be passed all the way to the
 * point where they are used for seemingly trivial computations, and
 * this may look obscure and overengineered at the first glance.
 * However, these methods in this class might eventually be moved
 * into something like an instantiable `ImplicitTilingInfo` class.
 *
 * The methods usually assume that the subdivison scheme is
 * either `QUADTREE` and `OCTREE`, and will throw an
 * `ImplicitTilingError` if this is not the case.
 *
 * @internal
 */
export class ImplicitTilings {
  /**
   * Returns a generator for the tile coordinates of a single subtree
   * for the given implicit tiling object.
   *
   * @param implicitTiling - The `TileImplicitTiling` object
   * @returns The generator
   * @throws ImplicitTilingError if the given object does not
   * have a valid `subdivisionScheme`, or the number of subtree
   * levels is not positive
   */
  static createSubtreeCoordinatesIterator(
    implicitTiling: TileImplicitTiling
  ): Iterable<TreeCoordinates> {
    const levels = implicitTiling.subtreeLevels;
    if (levels < 1) {
      throw new ImplicitTilingError(
        `Invalid number of subtree levels: ${levels}`
      );
    }
    const r = this.createRootCoordinates(implicitTiling);
    const depthFirst = false;
    return r.descendants(levels - 1, depthFirst);
  }

  /**
   * Returns the total number of nodes in one subtree for the given
   * implicit tiling object.
   *
   * @param implicitTiling - The `TileImplicitTiling` object
   * @returns The number of nodes
   * @throws ImplicitTilingError if the given object does not
   * have a valid `subdivisionScheme`, or the number of subtree
   * levels is not positive
   */
  static computeNumberOfNodesPerSubtree(
    implicitTiling: TileImplicitTiling
  ): number {
    const levels = implicitTiling.subtreeLevels;
    if (levels < 1) {
      throw new ImplicitTilingError(
        `Invalid number of subtree levels: ${levels}`
      );
    }
    if (implicitTiling.subdivisionScheme === "QUADTREE") {
      return Quadtrees.computeNumberOfNodesForLevels(levels);
    }
    if (implicitTiling.subdivisionScheme === "OCTREE") {
      return Octrees.computeNumberOfNodesForLevels(levels);
    }
    throw new ImplicitTilingError(
      `Invalid subdivisionScheme: ${implicitTiling.subdivisionScheme}`
    );
  }

  /**
   * Returns the number of nodes in the specified level of a
   * tree with the given implicit tiling
   *
   * @param implicitTiling - The `TileImplicitTiling` object
   * @param level - The level
   * @returns The number of nodes
   * @throws ImplicitTilingError if the given object does not
   * have a valid `subdivisionScheme`, or the level is negative.
   */
  static computeNumberOfNodesInLevel(
    implicitTiling: TileImplicitTiling,
    level: number
  ): number {
    if (level < 0) {
      throw new ImplicitTilingError(`Invalid level: ${level}`);
    }
    const size = 1 << level;
    if (implicitTiling.subdivisionScheme === "QUADTREE") {
      return size * size;
    }
    if (implicitTiling.subdivisionScheme === "OCTREE") {
      return size * size * size;
    }
    throw new ImplicitTilingError(
      `Invalid subdivisionScheme: ${implicitTiling.subdivisionScheme}`
    );
  }

  /**
   * Substitutes the given coordinates into the given template URI.
   *
   * @param subdivisionScheme - The subdivision scheme
   * @param templateUri - The template URI
   * @param coordinates - The tree coordinates
   * @returns The resulting URI
   * @throws ImplicitTilingError if the `subdivisionScheme` is not valid.
   */
  static substituteTemplateUri(
    subdivisionScheme: string,
    templateUri: string,
    coordinates: TreeCoordinates
  ): string {
    if (subdivisionScheme === "QUADTREE") {
      const quadtreeCoordinates = coordinates as QuadtreeCoordinates;
      return TemplateUris.substituteQuadtree(templateUri, quadtreeCoordinates);
    }
    if (subdivisionScheme === "OCTREE") {
      const octreeCoordinates = coordinates as OctreeCoordinates;
      return TemplateUris.substituteOctree(templateUri, octreeCoordinates);
    }
    throw new ImplicitTilingError(
      `Invalid subdivisionScheme: ${subdivisionScheme}`
    );
  }

  /**
   * Creates a string representation for the given coordinates, describing
   * them as coordinates of a tile within an implicit tileset.
   *
   * Details about the returned string are not specified. But it is
   * supposed to be a string that contains the level,x,y,[z] components
   * of the given coordinates for `QuadtreeCoordinates` and
   * `OctreeCoordinates`.
   *
   * @param coordinates - The tree coordinates
   * @returns The result
   * @throws ImplicitTilingError if the coordinates are neither
   * `QuadtreeCoordinates` nor `OctreeCoordinates`.
   */
  static createString(coordinates: TreeCoordinates): string {
    if (coordinates instanceof QuadtreeCoordinates) {
      const level = coordinates.level;
      const x = coordinates.x;
      const y = coordinates.y;
      const result = `at[${level}][${x},${y}]`;
      return result;
    }
    if (coordinates instanceof OctreeCoordinates) {
      const level = coordinates.level;
      const x = coordinates.x;
      const y = coordinates.y;
      const z = coordinates.z;
      const result = `at[${level}][${x},${y},${z}]`;
      return result;
    }
    throw new ImplicitTilingError(`Invalid coordinates type: ${coordinates}`);
  }

  /**
   * Returns the root coordinates for the specified implicit tileset.
   *
   * @param implicitTiling - The `TileImplicitTiling` object
   * @returns The root coordinates
   * @throws ImplicitTilingError if the given object does not
   * have a valid `subdivisionScheme`.
   */
  static createRootCoordinates(
    implicitTiling: TileImplicitTiling
  ): TreeCoordinates {
    const subdivisionScheme = implicitTiling.subdivisionScheme;
    if (subdivisionScheme === "QUADTREE") {
      return new QuadtreeCoordinates(0, 0, 0);
    }
    if (subdivisionScheme === "OCTREE") {
      return new OctreeCoordinates(0, 0, 0, 0);
    }
    throw new ImplicitTilingError(
      `Invalid subdivisionScheme: ${subdivisionScheme}`
    );
  }

  /**
   * Computes the global coordinates from the given local ones.
   *
   * The `rootCoordinates` are the root coordinates of a subtree
   * in the given implicit tiling. The `coordinates` are the local
   * coordinates of a node within this subtree.
   * The result will be the global coordinates for the node within
   * the given implicit tiling.
   *
   * @param implicitTiling - The `TileImplicitTiling` object
   * @param rootCoordinates - The root coordinates
   * @param coordinates - The coordinates
   * @returns The global coordinates
   * @throws ImplicitTilingError if the given object does not
   * have a valid `subdivisionScheme`.
   */
  static globalizeCoordinates(
    implicitTiling: TileImplicitTiling,
    rootCoordinates: TreeCoordinates,
    coordinates: TreeCoordinates
  ): TreeCoordinates {
    const subdivisionScheme = implicitTiling.subdivisionScheme;
    if (subdivisionScheme === "QUADTREE") {
      const quadtreeRootCoordinates = rootCoordinates as QuadtreeCoordinates;
      const quadtreeCoordinates = coordinates as QuadtreeCoordinates;
      return ImplicitTilings.globalizeQuadtreeCoords(
        quadtreeRootCoordinates,
        quadtreeCoordinates
      );
    }
    if (subdivisionScheme === "OCTREE") {
      const octreeRootCoordinates = rootCoordinates as OctreeCoordinates;
      const octreeCoordinates = coordinates as OctreeCoordinates;
      return ImplicitTilings.globalizeOctreeCoords(
        octreeRootCoordinates,
        octreeCoordinates
      );
    }
    throw new ImplicitTilingError(
      `Invalid subdivisionScheme: ${subdivisionScheme}`
    );
  }

  /**
   * Compute the global quadtree coordinates for the given coordinates.
   *
   * @param rootCoords - The (global) root coordinates of the subtree
   * @param localCoords - The local coordinates inside the subtree
   * @returns The global coordinates
   */
  private static globalizeQuadtreeCoords(
    rootCoords: QuadtreeCoordinates,
    localCoords: QuadtreeCoordinates
  ): QuadtreeCoordinates {
    const rootLevel = rootCoords.level;
    const rootX = rootCoords.x;
    const rootY = rootCoords.y;

    const localLevel = localCoords.level;
    const localX = localCoords.x;
    const localY = localCoords.y;

    const globalLevel = rootLevel + localLevel;
    const globalX = (rootX << localLevel) + localX;
    const globalY = (rootY << localLevel) + localY;

    const globalCoords = new QuadtreeCoordinates(globalLevel, globalX, globalY);
    return globalCoords;
  }

  /**
   * Compute the global octree coordinates for the given coordinates.
   *
   * @param rootCoords - The (global) root coordinates of the subtree
   * @param localCoords - The local coordinates inside the subtree
   * @returns The global coordinates
   */
  private static globalizeOctreeCoords(
    rootCoords: OctreeCoordinates,
    localCoords: OctreeCoordinates
  ): OctreeCoordinates {
    const rootLevel = rootCoords.level;
    const rootX = rootCoords.x;
    const rootY = rootCoords.y;
    const rootZ = rootCoords.z;

    const localLevel = localCoords.level;
    const localX = localCoords.x;
    const localY = localCoords.y;
    const localZ = localCoords.z;

    const globalLevel = rootLevel + localLevel;
    const globalX = (rootX << localLevel) + localX;
    const globalY = (rootY << localLevel) + localY;
    const globalZ = (rootZ << localLevel) + localZ;

    const globalCoords = new OctreeCoordinates(
      globalLevel,
      globalX,
      globalY,
      globalZ
    );
    return globalCoords;
  }
}
