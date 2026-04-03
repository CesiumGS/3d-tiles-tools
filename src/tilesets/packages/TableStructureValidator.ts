import { Database } from "better-sqlite3";

/**
 * A simple type describing the structure of a database
 * table, consisting of the table name, and the names
 * and types of the columns.
 *
 * @internal
 */
export type TableStructure = {
  /**
   * The name of the table
   */
  name: string;

  /**
   * The columns structure.
   *
   * Each column consists of a name, and the type, like
   * 'TEXT' or 'BLOB'.
   */
  columns: { name: string; type: string }[];
};

/**
 * A class that can validate that a (better-sqlite3) Database
 * has a certain structure.
 *
 * @internal
 */
export class TableStructureValidator {
  /**
   * Validates that the given database has a table with the
   * given structure.
   *
   * @param db - The database
   * @param tableStructure - The table structure
   * @returns An (unspecified, but elaborate) error message,
   * or `undefined` if the structure is valid
   */
  static validate(
    db: Database,
    tableStructure: TableStructure
  ): string | undefined {
    // Try to select (at most) one row from the table with the
    // name that is given in the TableStructure
    let selection;
    try {
      const sql = `SELECT * FROM ${tableStructure.name} LIMIT 1`;
      selection = db.prepare(sql);
    } catch (e) {
      return `${e}`;
    }
    const expectedColumns = tableStructure.columns;

    // Obtain the column information from the statement,
    // as `ColumnDefinition` objects
    const actualColumns = selection.columns();
    if (actualColumns.length !== expectedColumns.length) {
      return (
        `Table ${tableStructure.name} must have ${expectedColumns.length} ` +
        `columns, but has ${actualColumns.length}`
      );
    }

    // Compare the name and type of the actual columns to
    // the ones that are contained in the TableStructure
    for (let c = 0; c < actualColumns.length; c++) {
      const expectedName = expectedColumns[c].name;
      const actualName = actualColumns[c].name;
      if (actualName !== expectedName) {
        return `Column ${c} name must be ${expectedName}, but is ${actualName}`;
      }
      const expectedType = expectedColumns[c].type;
      const actualType = actualColumns[c].type;
      if (actualType !== expectedType) {
        return `Column ${c} type must be ${expectedType}, but is ${actualType}`;
      }
    }
    return undefined;
  }
}
