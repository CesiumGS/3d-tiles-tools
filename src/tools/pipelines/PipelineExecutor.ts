import fs from "fs";
import os from "os";
import path from "path";

import { Pipeline } from "./Pipeline";
import { TilesetStageExecutor } from "./TilesetStageExecutor";

import { Loggers } from "../../base";
const logger = Loggers.get("pipeline");

/**
 * Methods to execute `Pipeline` objects.
 *
 * @internal
 */
export class PipelineExecutor {
  /**
   * The directory to store temporary files in.
   *
   * If this is `undefined`, then a directory in the
   * default system temp directory will be used.
   */
  private static tempBaseDirectory: string | undefined;

  /**
   * Set the directory to store temporary files in.
   *
   * If this is `undefined`, then a directory in the
   * default system temp directory will be used.
   *
   * This is primarily intended for testing, demos, and
   * debugging.
   *
   * @param directory - The directory
   */
  static setTempBaseDirectory(directory: string | undefined) {
    PipelineExecutor.tempBaseDirectory = directory;
  }

  /**
   * Executes the given `Pipeline`.
   *
   * @param pipeline - The `Pipeline` object
   * @param overwrite - Whether outputs should be overwritten if
   * they already exist
   * @returns A promise that resolves when the process is finished
   * @throws PipelineError If one of the processing steps causes
   * an error.
   */
  static async executePipeline(pipeline: Pipeline, overwrite: boolean) {
    let currentInput = pipeline.input;
    let currentOutput: string | undefined = undefined;
    let currentOverwrite = true;

    const tilesetStages = pipeline.tilesetStages;

    // Create a temporary directory for the intermediate
    // processing steps (if there are more than one)
    // TODO: This is not cleaned up at the end...
    let tempBasePath = PipelineExecutor.tempBaseDirectory;
    if (!tempBasePath) {
      if (tilesetStages.length > 1) {
        tempBasePath = fs.mkdtempSync(
          path.join(os.tmpdir(), "3d-tiles-tools-pipeline-")
        );
      }
    }

    // Execute each `TilesetStage`
    for (let t = 0; t < tilesetStages.length; t++) {
      const tilesetStage = tilesetStages[t];

      const message =
        `  Executing tilesetStage ${t} of ` +
        `${tilesetStages.length}: ${tilesetStage.name}`;
      logger.debug(message);

      if (t == tilesetStages.length - 1) {
        currentOutput = pipeline.output;
        currentOverwrite = overwrite;
      } else {
        const nameSuffix = tilesetStage.name.replace(/[^\w\s]/gi, "");
        currentOutput = `${tempBasePath}/tilesetStage-${t}-${nameSuffix}`;
        currentOverwrite = true;
      }

      await TilesetStageExecutor.executeTilesetStage(
        tilesetStage,
        currentInput,
        currentOutput,
        currentOverwrite
      );
      currentInput = currentOutput;
    }
  }
}
