import { RootProperty } from "./RootProperty";

export interface Availability extends RootProperty {
  bitstream?: number;
  availableCount?: number;
  constant?: number;
}
