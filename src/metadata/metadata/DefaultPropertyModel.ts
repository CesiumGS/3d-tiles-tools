import { PropertyModel } from "./PropertyModel";

/**
 * Default implementation of a `PropertyModel` that is
 * backed by untyped JSON data.
 *
 * @internal
 */
export class DefaultPropertyModel implements PropertyModel {
  private readonly data: any[];

  constructor(data: any[]) {
    this.data = data;
  }

  /** {@inheritDoc PropertyModel.getPropertyValue} */
  getPropertyValue(index: number): any {
    return this.data[index];
  }
}
