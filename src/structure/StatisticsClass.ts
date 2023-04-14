import { RootProperty } from "./RootProperty";
import { StatisticsClassProperty } from "./StatisticsClassProperty";

/** @internal */
export interface StatisticsClass extends RootProperty {
  count?: number;
  properties: { [key: string]: StatisticsClassProperty };
}
