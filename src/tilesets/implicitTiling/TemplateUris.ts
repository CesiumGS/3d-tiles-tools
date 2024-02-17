import { OctreeCoordinates } from "../../base";
import { QuadtreeCoordinates } from "../../base";

/**
 * Method related to template URIs for implicit tiling.
 *
 * @internal
 */
export class TemplateUris {
  /**
   * Substitute all appearances of \{level\}, \{x\}, and \{y\} in
   * the given string with the respective value from the given
   * coordinates.
   *
   * @param templateUri - The template URI string
   * @param coordinates - The coordinates
   * @returns The string with the substitutions applied
   */
  static substituteQuadtree(
    templateUri: string,
    coordinates: QuadtreeCoordinates
  ) {
    return TemplateUris.substituteQuadtreeInternal(
      templateUri,
      coordinates.level,
      coordinates.x,
      coordinates.y
    );
  }

  /**
   * Resolves each appearance of \{level\}, \{x\},
   * and \{y\} in the given template string with the
   * respective parameters.
   *
   * @param templateUri - The template URI
   * @param level - The level
   * @param x - The x-coordinate
   * @param y - The y-coordinate
   * @returns The result
   */
  static substituteQuadtreeInternal(
    templateUri: string,
    level: number,
    x: number,
    y: number
  ) {
    let result = templateUri;
    result = result.replace(/{level}/g, `${level}`);
    result = result.replace(/{x}/g, `${x}`);
    result = result.replace(/{y}/g, `${y}`);
    return result;
  }

  /**
   * Substitute all appearances of \{level\}, \{x\}, \{y\}, and \{z\} in
   * the given string with the respective value from the given
   * coordinates.
   *
   * @param templateUri - The template URI string
   * @param coordinates - The coordinates
   * @returns The string with the substitutions applied
   */
  static substituteOctree(templateUri: string, coordinates: OctreeCoordinates) {
    return TemplateUris.substituteOctreeInternal(
      templateUri,
      coordinates.level,
      coordinates.x,
      coordinates.y,
      coordinates.z
    );
  }

  /**
   * Resolves each appearance of \{level\}, \{x\},
   * \{y\}, and \{z\} in the given template string
   * with the respective parameters.
   *
   * @param templateUri - The template URI
   * @param level - The level
   * @param x - The x-coordinate
   * @param y - The y-coordinate
   * @param z - The z-coordinate
   * @returns The result
   */
  static substituteOctreeInternal(
    templateUri: string,
    level: number,
    x: number,
    y: number,
    z: number
  ) {
    let result = templateUri;
    result = result.replace(/{level}/g, `${level}`);
    result = result.replace(/{x}/g, `${x}`);
    result = result.replace(/{y}/g, `${y}`);
    result = result.replace(/{z}/g, `${z}`);
    return result;
  }
}
