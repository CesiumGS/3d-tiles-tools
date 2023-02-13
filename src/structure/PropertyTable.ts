import { PropertyTableProperty } from "./PropertyTableProperty";
import { RootProperty } from "./RootProperty";

export interface PropertyTable extends RootProperty {
  name?: string;
  class: string;
  count: number;
  properties?: { [key: string]: PropertyTableProperty };
}
