import { RootProperty } from "./RootProperty";

export interface Asset extends RootProperty {
  version: string;
  tilesetVersion?: string;
}
