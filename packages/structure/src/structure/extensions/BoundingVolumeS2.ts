import { RootProperty } from "../RootProperty.js";

/**
 * An S2 bounding volume
 *
 * @internal
 */
export interface BoundingVolumeS2 extends RootProperty {
  token: string;
  minimumHeight: number;
  maximumHeight: number;
}
