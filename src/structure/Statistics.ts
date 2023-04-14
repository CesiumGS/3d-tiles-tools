import { RootProperty } from "./RootProperty";
import { StatisticsClass } from "./StatisticsClass";

/** @internal */
export interface Statistics extends RootProperty {
  classes: { [key: string]: StatisticsClass };
}
