import { PropertyType, Ref } from "@gltf-transform/core";
import { IProperty } from "@gltf-transform/core";
import { Accessor } from "@gltf-transform/core";
import { ExtensionProperty } from "@gltf-transform/core";

const NAME = "CESIUM_primitive_outline";

interface IPrimitiveOutline extends IProperty {
  indices: Accessor;
}

/**
 * Main model class for `CESIUM_primitive_outline`
 *
 * @internal
 */
export class PrimitiveOutline extends ExtensionProperty<IPrimitiveOutline> {
  static override EXTENSION_NAME = NAME;
  public declare extensionName: typeof NAME;
  public declare propertyType: "PrimitiveOutline";
  public declare parentTypes: [PropertyType.PRIMITIVE];

  protected override init(): void {
    this.extensionName = NAME;
    this.propertyType = "PrimitiveOutline";
    this.parentTypes = [PropertyType.PRIMITIVE];
  }

  protected override getDefaults() {
    return Object.assign(super.getDefaults());
  }

  public getIndices(): Accessor | null {
    return this.getRef("indices");
  }

  public setIndices(indices: Accessor): this {
    return this.setRef("indices", indices, { usage: "OTHER" });
  }
}
