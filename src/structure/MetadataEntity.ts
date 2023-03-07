import { RootProperty } from "./RootProperty";

/** @internal */
export interface MetadataEntity extends RootProperty {
  class: string;
  properties?: { [key: string]: any };
}
