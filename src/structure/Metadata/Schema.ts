import { RootProperty } from "../RootProperty";
import { MetadataClass } from "./MetadataClass";
import { MetadataEnum } from "./MetadataEnum";

export interface Schema extends RootProperty {
  id: string;
  name?: string;
  description?: string;
  version?: string;
  classes?: { [key: string]: MetadataClass };
  enums?: { [key: string]: MetadataEnum };
}
