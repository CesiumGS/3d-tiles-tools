import { ExtensionProperty } from "@gltf-transform/core";
import { Texture } from "@gltf-transform/core";
import { TextureInfo } from "@gltf-transform/core";
import { IProperty } from "@gltf-transform/core";
import { PropertyType } from "@gltf-transform/core";

import { PropertyTable } from "./StructuralMetadata";

const NAME = "EXT_mesh_features";

//============================================================================
// Interfaces for the model classes
//
// These correspond to the classes that are defined as the actual extension
// properties, as
//   export class MeshFeatures extends ExtensionProperty<IMeshFeatures> {...}
//
// The naming convention for these interfaces is that they start with `I...`.
// They all have to extend the `IProperty` interface.
//
// Note that the textures in these interfaces are using the actual
// `Texture` type of the public glTF-Transform API, and each `texture`
// has an associated `TextureInfo`. This is used internally by glTF-Transform
// for some deduplication magic or whatnot.
//
// More genenerally: The types of the properties in these interfaces
// are the model classes themself, and NOT the interface. So it is
//     featureIds: FeatureId[];
// and not
//     featureIds: IFeatureId[];
//
// These interfaces are NOT publicly visible. They only serve as the type
// pararameter for the `ExtensionProperty` class, which is the base
// for the actual "model" classes that are exposed to the user.
//
// In these interfaces, optional properties are generally represented
// with the type being `... | null` when they have primitive types.
// In the model classes, the respective getters and setters will
// return/accept the `... null` type accordingly.
//
// For "reference typed" properties (i.e. references to other model
// classes), the fact that they are optional is built-in into the
// reference type itself: The corresponding methods of the model
// classes will return or accept the `...|null` type automatically.

interface IMeshFeatures extends IProperty {
  featureIds: FeatureId[];
}
interface IFeatureId extends IProperty {
  featureCount: number;
  nullFeatureId: number | null;
  label: string | null;
  attribute: FeatureIdAttribute | null;
  texture: FeatureIdTexture;
  propertyTable: PropertyTable;
}
type FeatureIdAttribute = number;
interface IFeatureIdTexture extends IProperty {
  channels: number[];
  texture: Texture;
  textureInfo: TextureInfo;
}
//============================================================================

//============================================================================
// The actual model classes
//
// These are exported, and visible to users.
//
// They offer accessor methods for the properties that are defined in
// the model class interfaces. Depending on the type of the properties,
// these accesor methods come in different flavors:
//
// - For "primitive" property types (like `number`, `boolean` and `string`),
//   the implementations use `this.get(...)`/`this.set(...)`
// - For property types that correspond to other "model" classes,
//   the implementations use `this.getRef(...)`/`this.setRef(...)`.
// - For property types that correspond to ARRAYS of "model" classes,
//   the implementations don't offer "getters/setters", but instead,
//   they offer `add/remove/list` methods, implemented based on
//   `this.addRef(...)`/`this.removeRef(...)`/`this.listRefs(...)`.
//
// A special case is that of textures:
//
// Each texture in these classes is modeled as a property with the
// type `Texture`, and an associated `TextureInfo`. The `TextureInfo`
// can only be accessed with a `get` method, but not explicitly
// set: It is managed internally by glTF-Transform. So for
// an `exampleTextureInfo: TextureInfo` property, there will only
// be a getter, implemented as
// ```
// getExampleTextureInfo(): TextureInfo | null {
//   return this.getRef("exampleTexture") ?
//     this.getRef("exampleTextureInfo") : null;
// }
// ```

/**
 * Main model class of `EXT_mesh_features`
 *
 * @internal
 */
export class MeshFeatures extends ExtensionProperty<IMeshFeatures> {
  static override EXTENSION_NAME = NAME;
  public declare extensionName: typeof NAME;
  public declare propertyType: "MeshFeatures";
  public declare parentTypes: [PropertyType.PRIMITIVE];

  protected override init(): void {
    this.extensionName = NAME;
    this.propertyType = "MeshFeatures";
    this.parentTypes = [PropertyType.PRIMITIVE];
  }

  protected override getDefaults() {
    return Object.assign(super.getDefaults(), {
      featureIds: [],
    });
  }

  listFeatureIds(): FeatureId[] {
    return this.listRefs("featureIds");
  }
  addFeatureId(featureId: FeatureId) {
    return this.addRef("featureIds", featureId);
  }
  removeFeatureId(featureId: FeatureId) {
    return this.removeRef("featureIds", featureId);
  }
}

/**
 * Implementation of a feature ID for `EXT_mesh_features`
 *
 * @internal
 */
export class FeatureId extends ExtensionProperty<IFeatureId> {
  static override EXTENSION_NAME = NAME;
  public declare extensionName: typeof NAME;
  public declare propertyType: "FeatureId";
  public declare parentTypes: ["MeshFeatures"];

  protected override init(): void {
    this.extensionName = NAME;
    this.propertyType = "FeatureId";
    this.parentTypes = ["MeshFeatures"];
  }

  protected override getDefaults() {
    return Object.assign(super.getDefaults(), {
      nullFeatureId: null,
      label: null,
      attribute: null,
      texture: null,
      propertyTable: null,
    });
  }

  getFeatureCount(): number {
    return this.get("featureCount");
  }
  setFeatureCount(featureCount: number) {
    return this.set("featureCount", featureCount);
  }

  getNullFeatureId(): number | null {
    return this.get("nullFeatureId");
  }
  setNullFeatureId(nullFeatureId: number | null) {
    return this.set("nullFeatureId", nullFeatureId);
  }

  getLabel(): string | null {
    return this.get("label");
  }
  setLabel(label: string | null) {
    return this.set("label", label);
  }

  getAttribute(): FeatureIdAttribute | null {
    return this.get("attribute");
  }
  setAttribute(attribute: FeatureIdAttribute | null) {
    return this.set("attribute", attribute);
  }

  getTexture(): FeatureIdTexture | null {
    return this.getRef("texture");
  }
  setTexture(texture: FeatureIdTexture | null) {
    return this.setRef("texture", texture);
  }

  getPropertyTable(): PropertyTable | null {
    return this.getRef("propertyTable");
  }
  setPropertyTable(propertyTable: PropertyTable | null) {
    return this.setRef("propertyTable", propertyTable);
  }
}

/**
 * Implementation of a feature ID texture for `EXT_mesh_features`
 *
 * @internal
 */
export class FeatureIdTexture extends ExtensionProperty<IFeatureIdTexture> {
  static override EXTENSION_NAME = NAME;

  public declare extensionName: typeof NAME;
  public declare propertyType: "FeatureIdTexture";
  public declare parentTypes: ["FeatureId"];

  protected override init(): void {
    this.extensionName = NAME;
    this.propertyType = "FeatureIdTexture";
    this.parentTypes = ["FeatureId"];
  }

  protected override getDefaults() {
    const defaultTextureInfo = new TextureInfo(this.graph, "textureInfo");
    defaultTextureInfo.setMinFilter(TextureInfo.MagFilter.NEAREST);
    defaultTextureInfo.setMagFilter(TextureInfo.MagFilter.NEAREST);
    return Object.assign(super.getDefaults(), {
      channels: [0],
      texture: null,
      textureInfo: defaultTextureInfo,
    });
  }

  getChannels(): number[] {
    return this.get("channels");
  }
  setChannels(channels: number[]) {
    return this.set("channels", channels);
  }

  getTexture(): Texture | null {
    return this.getRef("texture");
  }
  setTexture(texture: Texture | null) {
    return this.setRef("texture", texture);
  }

  getTextureInfo(): TextureInfo | null {
    return this.getRef("texture") ? this.getRef("textureInfo") : null;
  }
}
