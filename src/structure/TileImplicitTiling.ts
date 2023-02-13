import { RootProperty } from "./RootProperty";
import { Subtrees } from "./Subtrees";

export interface TileImplicitTiling extends RootProperty {
  subdivisionScheme: string;
  subtreeLevels: number;
  availableLevels: number;
  subtrees: Subtrees;
}
