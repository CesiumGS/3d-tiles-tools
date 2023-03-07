import { RootProperty } from "./RootProperty";
import { Subtrees } from "./Subtrees";

/** @internal */
export interface TileImplicitTiling extends RootProperty {
  subdivisionScheme: string;
  subtreeLevels: number;
  availableLevels: number;
  subtrees: Subtrees;
}
