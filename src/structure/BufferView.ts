import { RootProperty } from "./RootProperty";

/** @internal */
export interface BufferView extends RootProperty {
  buffer: number;
  byteOffset: number;
  byteLength: number;
  name?: string;
}
