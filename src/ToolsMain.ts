import fs from "fs";

import { Paths } from "./base/Paths";
import { DeveloperError } from "./base/DeveloperError";

import { Tilesets } from "./tilesets/Tilesets";

import { TileFormats } from "./tileFormats/TileFormats";

import { ContentOps } from "./contentProcessing/ContentOps";
import { GltfUtilities } from "./contentProcessing/GtlfUtilities";

import { ContentDataTypes } from "./contentTypes/ContentDataTypes";

import { PipelineExecutor } from "./pipelines/PipelineExecutor";
import { Pipelines } from "./pipelines/Pipelines";

/**
 * Functions that directly correspond to the command line functionality.
 *
 * The functions that directly operate on individual files (tile content),
 * like `cmptToGlb`, will just read the input data, perform the operation,
 * and write the output data.
 *
 * The "simple" tileset operations (like `combine` or `merge`) are
 * implemented based on the utility functions in the `Tilesets` class.
 *
 * Some operations (like `gzip`) are implemented by creating the
 * preliminary JSON representation of the processing pipeline, then
 * creating a `Pipeline` object from that, and executing that pipeline.
 */
export class ToolsMain {
  static async b3dmToGlb(input: string, output: string, force: boolean) {
    ToolsMain.ensureCanWrite(output, force);
    const inputBuffer = fs.readFileSync(input);
    const inputTileData = TileFormats.readTileData(inputBuffer);
    const outputBuffer = inputTileData.payload;
    const upgradedOutputBuffer = await GltfUtilities.upgradeGlb(outputBuffer);
    fs.writeFileSync(output, upgradedOutputBuffer);
  }
  static async i3dmToGlb(input: string, output: string, force: boolean) {
    return ToolsMain.b3dmToGlb(input, output, force);
  }
  static async cmptToGlb(input: string, output: string, force: boolean) {
    const inputBuffer = fs.readFileSync(input);
    const glbBuffers = TileFormats.extractGlbBuffers(inputBuffer);
    const glbsLength = glbBuffers.length;
    const glbPaths = new Array(glbsLength);
    if (glbsLength === 0) {
      throw new DeveloperError(`No glbs found in ${input}.`);
    } else if (glbsLength === 1) {
      glbPaths[0] = output;
    } else {
      const prefix = Paths.replaceExtension(output, "");
      for (let i = 0; i < glbsLength; ++i) {
        glbPaths[i] = `${prefix}_${i}.glb`;
      }
    }
    for (let i = 0; i < glbsLength; i++) {
      const glbPath = glbPaths[i];
      ToolsMain.ensureCanWrite(glbPath, force);
      const glbBuffer = glbBuffers[i];
      const upgradedOutputBuffer = await GltfUtilities.upgradeGlb(glbBuffer);
      fs.writeFileSync(glbPath, upgradedOutputBuffer);
    }
  }
  static async glbToB3dm(input: string, output: string, force: boolean) {
    ToolsMain.ensureCanWrite(output, force);
    const inputBuffer = fs.readFileSync(input);
    const outputTileData =
      TileFormats.createDefaultB3dmTileDataFromGlb(inputBuffer);
    const outputBuffer = TileFormats.createTileDataBuffer(outputTileData);
    fs.writeFileSync(output, outputBuffer);
  }
  static async glbToI3dm(input: string, output: string, force: boolean) {
    ToolsMain.ensureCanWrite(output, force);
    const inputBuffer = fs.readFileSync(input);
    const outputTileData =
      TileFormats.createDefaultI3dmTileDataFromGlb(inputBuffer);
    const outputBuffer = TileFormats.createTileDataBuffer(outputTileData);
    fs.writeFileSync(output, outputBuffer);
  }
  static async optimizeB3dm(
    input: string,
    output: string,
    force: boolean,
    options: any
  ) {
    ToolsMain.ensureCanWrite(output, force);
    const inputBuffer = fs.readFileSync(input);
    const outputBuffer = await ContentOps.optimizeB3dmBuffer(
      inputBuffer,
      options
    );
    fs.writeFileSync(output, outputBuffer);
  }
  static async optimizeI3dm(
    input: string,
    output: string,
    force: boolean,
    options: any
  ) {
    ToolsMain.ensureCanWrite(output, force);
    const inputBuffer = fs.readFileSync(input);
    const outputBuffer = await ContentOps.optimizeI3dmBuffer(
      inputBuffer,
      options
    );
    fs.writeFileSync(output, outputBuffer);
  }

  private static createGzipPipelineJson(
    input: string,
    output: string,
    tilesOnly: boolean
  ) {
    let includedContentTypes = undefined;
    const excludedContentTypes = undefined;
    if (tilesOnly === true) {
      includedContentTypes = [
        ContentDataTypes.CONTENT_TYPE_B3DM,
        ContentDataTypes.CONTENT_TYPE_I3DM,
        ContentDataTypes.CONTENT_TYPE_PNTS,
        ContentDataTypes.CONTENT_TYPE_CMPT,
        ContentDataTypes.CONTENT_TYPE_VCTR,
        ContentDataTypes.CONTENT_TYPE_GEOM,
        ContentDataTypes.CONTENT_TYPE_GLB,
        ContentDataTypes.CONTENT_TYPE_GLTF,
      ];
    }
    const contentStageJson = {
      name: "gzip",
      includedContentTypes: includedContentTypes,
      excludedContentTypes: excludedContentTypes,
    };
    const pipelineJson = {
      input: input,
      output: output,
      tilesetStages: [
        {
          name: "gzip",
          contentStages: [contentStageJson],
        },
      ],
    };
    return pipelineJson;
  }

  static async gzip(
    input: string,
    output: string,
    force: boolean,
    tilesOnly: boolean
  ) {
    ToolsMain.ensureCanWrite(output, force);

    const pipelineJson = ToolsMain.createGzipPipelineJson(
      input,
      output,
      tilesOnly
    );
    const pipeline = Pipelines.createPipeline(pipelineJson);
    await PipelineExecutor.executePipeline(pipeline, force);
  }

  private static createUngzipPipelineJson(input: string, output: string) {
    const contentStageJson = {
      name: "ungzip",
    };
    const pipelineJson = {
      input: input,
      output: output,
      tilesetStages: [
        {
          name: "ungzip",
          contentStages: [contentStageJson],
        },
      ],
    };
    return pipelineJson;
  }

  static async ungzip(input: string, output: string, force: boolean) {
    ToolsMain.ensureCanWrite(output, force);

    const pipelineJson = ToolsMain.createUngzipPipelineJson(input, output);
    const pipeline = Pipelines.createPipeline(pipelineJson);
    await PipelineExecutor.executePipeline(pipeline, force);
  }

  private static createTilesetToDatabasePipeline(
    input: string,
    output: string
  ) {
    const pipelineJson = {
      input: input,
      output: output,
      tilesetStages: [
        {
          name: "tilesetToDatabase",
        },
      ],
    };
    return pipelineJson;
  }

  static async tilesetToDatabase(
    input: string,
    output: string,
    force: boolean
  ) {
    ToolsMain.ensureCanWrite(output, force);

    const pipelineJson = ToolsMain.createTilesetToDatabasePipeline(
      input,
      output
    );
    const pipeline = Pipelines.createPipeline(pipelineJson);
    await PipelineExecutor.executePipeline(pipeline, force);
  }

  private static createDatabaseToTilesetPipeline(
    input: string,
    output: string
  ) {
    const pipelineJson = {
      input: input,
      output: output,
      tilesetStages: [
        {
          name: "databaseToTileset",
        },
      ],
    };
    return pipelineJson;
  }

  static async databaseToTileset(
    input: string,
    output: string,
    force: boolean
  ) {
    ToolsMain.ensureCanWrite(output, force);

    const pipelineJson = ToolsMain.createDatabaseToTilesetPipeline(
      input,
      output
    );
    const pipeline = Pipelines.createPipeline(pipelineJson);
    await PipelineExecutor.executePipeline(pipeline, force);
  }

  static async combine(input: string, output: string, force: boolean) {
    ToolsMain.ensureCanWrite(output, force);
    await Tilesets.combine(input, output, force);
  }

  static async upgrade(input: string, output: string, force: boolean) {
    ToolsMain.ensureCanWrite(output, force);
    await Tilesets.upgrade(input, output, force);
  }

  static async merge(inputs: string[], output: string, force: boolean) {
    ToolsMain.ensureCanWrite(output, force);
    await Tilesets.merge(inputs, output, force);
  }

  /**
   * Ensures that the specified file can be written, and throws
   * a `DeveloperError` otherwise.
   *
   * @param fileName - The file name
   * @param force The 'force' flag state from the command line
   * @returns Whether the file can be written
   * @throws DeveloperError When the file exists and `force` was `false`.
   */
  static ensureCanWrite(fileName: string, force: boolean): true {
    if (force) {
      return true;
    }
    if (!fs.existsSync(fileName)) {
      return true;
    }
    throw new DeveloperError(
      `File ${fileName} already exists. Specify -f or --force to overwrite existing files.`
    );
  }
}
