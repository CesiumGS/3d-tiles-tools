import { RootProperty } from "./RootProperty";
import { StatisticsClass } from "./StatisticsClass";

/**
 * Statistics about entities.
 * @internal
 */
export interface Statistics extends RootProperty {
  /**
   * A dictionary where each key corresponds to a class ID in the `classes`
   * dictionary of the metatata schema that was defined for the tileset
   * that contains these statistics. Each value is an object containing
   * statistics about entities that conform to the class.
   */
  classes?: { [key: string]: StatisticsClass };
}
