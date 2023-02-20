import { TilesetStage } from "./TilesetStage";

export interface Pipeline {
  input: string;
  output: string;
  tilesetStages: TilesetStage[];
}
