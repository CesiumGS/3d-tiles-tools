import fs from "fs";
import path from "path";

/**
 * Only for internal use and basic tests:
 *
 * Reads a JSON file, parses it, and returns the result.
 * If the file cannot be read or parsed, then an error
 * message will be printed and `undefined` is returned.
 *
 * @param filePath - The path to the file
 * @returns A the result or `undefined`
 */
export function readJsonUnchecked(filePath: string): object | undefined {
  try {
    const data = fs.readFileSync(filePath);
    try {
      const jsonString = data.toString();
      const result = JSON.parse(jsonString);
      return result;
    } catch (error) {
      console.error("Could parse JSON", error);
      return undefined;
    }
  } catch (error) {
    const resolved = path.resolve(filePath);
    console.error(
      `Could read JSON from ${filePath} resolved to ${resolved}`,
      error
    );
    return undefined;
  }
}
