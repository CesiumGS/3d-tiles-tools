import { PropertyTableModel } from "./PropertyTableModel";

/**
 * Utility methods related to `PropertyTableModel` instances
 */
export class PropertyTableModels {
  /**
   * Creates a string representation of the given `PropertyTableModel`.
   *
   * This is mainly intended for testing and debugging. The exact
   * format of the returned string is not specified.
   *
   * @param propertyTableModel - The `PropertyTableModel`
   * @returns The string
   */
  public static createString(propertyTableModel: PropertyTableModel): string {
    const propertyNames = propertyTableModel.getPropertyNames();
    const count = propertyTableModel.getCount();
    const columnWidths = PropertyTableModels.computeColumnWidths(
      propertyTableModel,
      propertyNames,
      count
    );

    let result = "";
    for (let c = 0; c < propertyNames.length; c++) {
      const n = propertyNames[c];
      if (c > 0) {
        result += " | ";
      }
      const columnWidth = columnWidths[n];
      result += PropertyTableModels.pad(n, columnWidth);
    }
    result += "\n";
    for (let r = 0; r < count; r++) {
      const row = propertyTableModel.getMetadataEntityModel(r);
      for (let c = 0; c < propertyNames.length; c++) {
        const n = propertyNames[c];
        const columnWidth = columnWidths[n];
        const v = row.getPropertyValue(n);
        if (c > 0) {
          result += " | ";
        }
        result += PropertyTableModels.pad(v, columnWidth);
      }
      result += "\n";
    }

    return result;
  }

  /**
   * Computes a mapping from property names to the column widths
   * for a table (i.e. to the lenght of the longest string
   * representation of any value in the respective column)
   *
   * @param propertyTableModel - The `PropertyTableModel`
   * @param propertyNames The property names
   * @param rows The number of rows
   * @returns The column widths
   */
  private static computeColumnWidths(
    propertyTableModel: PropertyTableModel,
    propertyNames: string[],
    rows: number
  ): { [key: string]: number } {
    const columnWidths: { [key: string]: number } = {};
    for (let c = 0; c < propertyNames.length; c++) {
      const n = propertyNames[c];
      let columnWidth = n.length;
      for (let r = 0; r < rows; r++) {
        const row = propertyTableModel.getMetadataEntityModel(r);
        const v = row.getPropertyValue(n);
        const s = `${v}`;
        columnWidth = Math.max(columnWidth, s.length);
      }
      columnWidths[n] = columnWidth;
    }
    return columnWidths;
  }

  /**
   * Create a string representation of the given value, padded
   * with spaces at the left to reach the given width.
   *
   * @param value - The value
   * @param width - The width
   * @returns The padded string
   */
  private static pad(value: any, width: number): string {
    let result = `${value}`;
    if (result.length < width) {
      result += " ".repeat(width - result.length);
    }
    return result;
  }
}
