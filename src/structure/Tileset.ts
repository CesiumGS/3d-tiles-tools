import { Asset } from "./Asset";
import { Group } from "./Group";
import { Schema } from "./Metadata/Schema";
import { MetadataEntity } from "./MetadataEntity";
import { Properties } from "./Properties";
import { RootProperty } from "./RootProperty";
import { Statistics } from "./Statistics";
import { Tile } from "./Tile";

/** @internal */
export interface Tileset extends RootProperty {
  asset: Asset;
  properties?: Properties;
  schema?: Schema;
  schemaUri?: string;
  statistics?: Statistics;
  groups?: Group[];
  metadata?: MetadataEntity;
  geometricError: number;
  root: Tile;
  extensionsUsed?: string[];
  extensionsRequired?: string[];
}
