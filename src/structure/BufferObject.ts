import { RootProperty } from "./RootProperty";

export interface BufferObject extends RootProperty {
  uri?: string;
  byteLength: number;
  name?: string;
}
