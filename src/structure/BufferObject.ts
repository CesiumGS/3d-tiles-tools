import { RootProperty } from "./RootProperty";

/** @internal */
export interface BufferObject extends RootProperty {
  uri?: string;
  byteLength: number;
  name?: string;
}
