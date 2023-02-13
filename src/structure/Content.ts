import { BoundingVolume } from "./BoundingVolume";
import { MetadataEntity } from "./MetadataEntity";
import { RootProperty } from "./RootProperty";

export interface Content extends RootProperty {
  boundingVolume?: BoundingVolume;
  uri: string;
  metadata?: MetadataEntity;
  group?: number;
}
