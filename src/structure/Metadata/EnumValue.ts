import { RootProperty } from "../RootProperty";

export interface EnumValue extends RootProperty {
  name: string;
  description?: string;
  value: number;
}
