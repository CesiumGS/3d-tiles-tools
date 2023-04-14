import { BoundingVolume } from "./BoundingVolume";
import { Content } from "./Content";
import { MetadataEntity } from "./MetadataEntity";
import { RootProperty } from "./RootProperty";
import { TileImplicitTiling } from "./TileImplicitTiling";

/** @internal */
export interface Tile extends RootProperty {
  boundingVolume: BoundingVolume;
  viewerRequestVolume?: BoundingVolume;
  geometricError: number;
  refine?: string;
  transform?: number[];
  content?: Content;
  contents?: Content[];
  metadata?: MetadataEntity;
  implicitTiling?: TileImplicitTiling;
  children?: Tile[];
}
