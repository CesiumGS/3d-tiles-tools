import { GlTFProperty } from "./GlTFProperty";
import { Accessor } from "./Accessor";
import { Animation } from "./Animation";
import { Asset } from "./Asset";
import { BufferObject } from "./BufferObject";
import { BufferView } from "./BufferView";
import { Camera } from "./Camera";
import { Image } from "./Image";
import { Material } from "./Material";
import { Mesh } from "./Mesh";
import { Node } from "./Node";
import { Sampler } from "./Sampler";
import { GlTFid } from "./GlTFid";
import { Scene } from "./Scene";
import { Skin } from "./Skin";
import { Texture } from "./Texture";

/**
 * The root object for a glTF asset.
 * @internal
 */
export interface GlTF extends GlTFProperty {
  /**
   * Names of glTF extensions used in this asset.
   */
  extensionsUsed?: string[];

  /**
   * Names of glTF extensions required to properly load this asset.
   */
  extensionsRequired?: string[];

  /**
   * An array of accessors.
   */
  accessors?: Accessor[];

  /**
   * An array of keyframe animations.
   */
  animations?: Animation[];

  /**
   * Metadata about the glTF asset.
   */
  asset: Asset;

  /**
   * An array of buffers.
   */
  buffers?: BufferObject[];

  /**
   * An array of bufferViews.
   */
  bufferViews?: BufferView[];

  /**
   * An array of cameras.
   */
  cameras?: Camera[];

  /**
   * An array of images.
   */
  images?: Image[];

  /**
   * An array of materials.
   */
  materials?: Material[];

  /**
   * An array of meshes.
   */
  meshes?: Mesh[];

  /**
   * An array of nodes.
   */
  nodes?: Node[];

  /**
   * An array of samplers.
   */
  samplers?: Sampler[];

  /**
   * The index of the default scene.
   */
  scene?: GlTFid;

  /**
   * An array of scenes.
   */
  scenes?: Scene[];

  /**
   * An array of skins.
   */
  skins?: Skin[];

  /**
   * An array of textures.
   */
  textures?: Texture[];
}
