import { RootProperty } from "./RootProperty";
import { StatisticsClass } from "./StatisticsClass";

export interface Statistics extends RootProperty {
  classes: { [key: string]: StatisticsClass };
}
