import { RootProperty } from "./RootProperty";

/** @internal */
export interface BoundingVolume extends RootProperty {
  region?: number[];
  box?: number[];
  sphere?: number[];
}
