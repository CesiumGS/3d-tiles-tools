import { Stage } from "./Stage";
import { PredicateAsync } from "../tilesetOperations/PredicateAsync";
import { TilesetEntry } from "../tilesetData/TilesetEntry";

export interface ContentStage extends Stage {
  condition: PredicateAsync<TilesetEntry> | undefined;
}
