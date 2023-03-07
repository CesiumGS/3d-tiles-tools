import { RootProperty } from "./RootProperty";

/** @internal */
export interface Availability extends RootProperty {
  bitstream?: number;
  availableCount?: number;
  constant?: number;
}
