import { RootProperty } from "./RootProperty";

/** @internal */
export interface Asset extends RootProperty {
  version: string;
  tilesetVersion?: string;
}
