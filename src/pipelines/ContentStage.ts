import { Stage } from "./Stage";
import { TilesetEntry } from "../tilesetData/TilesetEntry";

export interface ContentStage extends Stage {
  condition: ((e: TilesetEntry) => Promise<boolean>) | undefined;
}
