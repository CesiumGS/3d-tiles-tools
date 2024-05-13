import { ExtensionProperty } from "@gltf-transform/core";
import { IProperty } from "@gltf-transform/core";
import { PropertyType } from "@gltf-transform/core";
import { PropertyTable } from "./StructuralMetadata";

const NAME = "EXT_mesh_features";

//============================================================================
// Interfaces for the model classes
// (See `MeshFeatures` for details about the concepts)
//

interface IInstanceFeatures extends IProperty {
  featureIds: FeatureId[];
}
interface IFeatureId extends IProperty {
  featureCount: number;
  nullFeatureId: number | null;
  label: string | null;
  attribute: FeatureIdAttribute | null;
  propertyTable: PropertyTable;
}
type FeatureIdAttribute = number;
//============================================================================

//============================================================================
// The actual model classes
// (See `MeshFeatures` for details about the concepts)
//

/**
 * Main model class for `EXT_instance_features`
 *
 * @internal
 */
export class InstanceFeatures extends ExtensionProperty<IInstanceFeatures> {
  static override EXTENSION_NAME = NAME;
  public declare extensionName: typeof NAME;
  public declare propertyType: "InstanceFeatures";
  public declare parentTypes: [PropertyType.NODE];

  protected override init(): void {
    this.extensionName = NAME;
    this.propertyType = "InstanceFeatures";
    this.parentTypes = [PropertyType.NODE];
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
 * Implementation of a feature ID for `EXT_instance_features`
 *
 * @internal
 */
export class FeatureId extends ExtensionProperty<IFeatureId> {
  static override EXTENSION_NAME = NAME;
  public declare extensionName: typeof NAME;
  public declare propertyType: "FeatureId";
  public declare parentTypes: ["InstanceFeatures"];

  protected override init(): void {
    this.extensionName = NAME;
    this.propertyType = "FeatureId";
    this.parentTypes = ["InstanceFeatures"];
  }

  protected override getDefaults() {
    return Object.assign(super.getDefaults(), {
      nullFeatureId: null,
      label: null,
      attribute: null,
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

  getPropertyTable(): PropertyTable | null {
    return this.getRef("propertyTable");
  }
  setPropertyTable(propertyTable: PropertyTable | null) {
    return this.setRef("propertyTable", propertyTable);
  }
}
