import { RootProperty } from "../RootProperty";
import { ClassProperty } from "./ClassProperty";

/** @internal */
export interface MetadataClass extends RootProperty {
  name?: string;
  description?: string;
  properties?: { [key: string]: ClassProperty };
}
