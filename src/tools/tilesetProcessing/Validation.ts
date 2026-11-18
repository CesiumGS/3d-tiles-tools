import fs from "fs";
import path from "path";

import { Loggers } from "../../base";

const logger = Loggers.get("tilesetProcessing");

/**
 * The name of the optional validator package
 */
const VALIDATOR_PACKAGE_NAME = "3d-tiles-validator";

/**
 * A summary of a validation run on one output tileset
 */
export type ValidationSummary = {
  /**
   * The tileset JSON file that was validated
   */
  tilesetJsonPath: string;

  /**
   * The report file that was written (if any)
   */
  reportPath: string | undefined;

  numErrors: number;
  numWarnings: number;
  numInfos: number;

  /**
   * The messages of all issues with severity ERROR
   */
  errorMessages: string[];
};

/**
 * Wraps the 3D Tiles Validator for validating the tilesets that
 * are written by the converter.
 *
 * The validator is an optional dependency: it depends on the 3D Tiles
 * tools itself, so it cannot be a regular dependency without creating
 * a cycle. It is loaded at runtime when present. When it is not
 * installed, validation is skipped with a warning.
 */
export class Validation {
  private static validatorModule: any | undefined | null = undefined;

  /**
   * Loads the validator package if it is installed.
   *
   * @returns The validator module, or `undefined` if it is not available
   */
  private static async loadValidator(): Promise<any | undefined> {
    if (Validation.validatorModule !== undefined) {
      return Validation.validatorModule ?? undefined;
    }
    try {
      // The package name is kept in a variable so that bundlers and
      // the TypeScript compiler do not try to resolve it
      const moduleName = VALIDATOR_PACKAGE_NAME;
      Validation.validatorModule = await import(moduleName);
    } catch (e) {
      Validation.validatorModule = null;
      logger.warn(
        `The ${VALIDATOR_PACKAGE_NAME} package is not installed. ` +
          `Skipping validation. Install it with ` +
          `'npm install ${VALIDATOR_PACKAGE_NAME}' to validate the output.`
      );
    }
    return Validation.validatorModule ?? undefined;
  }

  /**
   * Validates the given tileset JSON file and writes the full
   * validation report next to it as `validation-report.json`.
   *
   * @param tilesetJsonPath - The tileset JSON file
   * @param validateContent - Whether tile content should be validated
   * (this runs the glTF validator on each tile and can be slow for
   * large tilesets)
   * @param writeReport - Whether to write the report file
   * @returns The summary, or `undefined` if the validator is not
   * installed
   */
  static async validateTileset(
    tilesetJsonPath: string,
    validateContent: boolean,
    writeReport: boolean
  ): Promise<ValidationSummary | undefined> {
    const validator = await Validation.loadValidator();
    if (!validator) {
      return undefined;
    }
    const options = new validator.ValidationOptions();
    options.validateContentData = validateContent;

    logger.info(`Validating ${tilesetJsonPath}`);
    const result = await validator.Validators.validateTilesetFile(
      tilesetJsonPath,
      options
    );

    let reportPath: string | undefined;
    if (writeReport) {
      reportPath = path.join(
        path.dirname(tilesetJsonPath),
        "validation-report.json"
      );
      fs.writeFileSync(reportPath, result.serialize());
    }

    const errorMessages: string[] = [];
    for (const issue of result.issues) {
      if (issue.severity === "ERROR") {
        errorMessages.push(`${issue.type} at ${issue.path}: ${issue.message}`);
      }
    }

    const summary: ValidationSummary = {
      tilesetJsonPath: tilesetJsonPath,
      reportPath: reportPath,
      numErrors: result.numErrors,
      numWarnings: result.numWarnings,
      numInfos: result.numInfos,
      errorMessages: errorMessages,
    };
    logger.info(
      `Validation of ${tilesetJsonPath}: ${summary.numErrors} errors, ` +
        `${summary.numWarnings} warnings, ${summary.numInfos} infos`
    );
    for (const message of errorMessages) {
      logger.error(message);
    }
    return summary;
  }
}
