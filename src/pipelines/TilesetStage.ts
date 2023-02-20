import { ContentStage } from "./ContentStage";
import { Stage } from "./Stage";

export interface TilesetStage extends Stage {
  contentStages: ContentStage[];
}
