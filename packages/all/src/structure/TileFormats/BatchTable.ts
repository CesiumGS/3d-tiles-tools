import { RootProperty } from "../RootProperty";
import { BatchTableBinaryBodyReference } from "./BatchTableBinaryBodyReference";

/**
 * A set of properties defining application-specific metadata for
 * features in a tile.
 * @internal
 */
export interface BatchTable extends RootProperty {
  [key: string]:
    | BatchTableBinaryBodyReference
    | any[]
    | { [key: string]: any } // For 'extensions' of RootProperty
    | undefined; // For 'extras' of RootProperty
}
