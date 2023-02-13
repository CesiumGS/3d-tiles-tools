import { RootProperty } from "../RootProperty";
import { EnumValue } from "./EnumValue";

export interface MetadataEnum extends RootProperty {
  name?: string;
  description?: string;
  valueType?: string;
  values: EnumValue[];
}
