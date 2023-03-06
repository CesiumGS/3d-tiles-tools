import { RootProperty } from "../RootProperty";

/** @internal */
export interface EnumValue extends RootProperty {
  name: string;
  description?: string;
  value: number;
}
