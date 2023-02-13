import { RootProperty } from "./RootProperty";

export interface StatisticsClassProperty extends RootProperty {
  min: any;
  max: any;
  mean: any;
  median: any;
  standardDeviation: any;
  variance: any;
  sum: any;
  occurrences?: { [key: string]: any };
}
