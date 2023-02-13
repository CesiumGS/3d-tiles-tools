import { RootProperty } from "./RootProperty";

export interface BufferView extends RootProperty {
  buffer: number;
  byteOffset: number;
  byteLength: number;
  name?: string;
}
