import { RootProperty } from "./RootProperty";

export interface BoundingVolume extends RootProperty {
  region?: number[];
  box?: number[];
  sphere?: number[];
}
