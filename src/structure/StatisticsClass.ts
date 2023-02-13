import { RootProperty } from "./RootProperty";
import { StatisticsClassProperty } from "./StatisticsClassProperty";

export interface StatisticsClass extends RootProperty {
  count?: number;
  properties: { [key: string]: StatisticsClassProperty };
}
