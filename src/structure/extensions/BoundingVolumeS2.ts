import { RootProperty } from "../RootProperty";

export interface BoundingVolumeS2 extends RootProperty {
  token: string;
  minimumHeight: number;
  maximumHeight: number;
}
