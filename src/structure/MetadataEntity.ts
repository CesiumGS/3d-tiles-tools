import { RootProperty } from "./RootProperty";

export interface MetadataEntity extends RootProperty {
  class: string;
  properties?: { [key: string]: any };
}
