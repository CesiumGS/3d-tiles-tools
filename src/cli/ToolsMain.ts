import fs from "fs";
import path from "path";

import { Paths } from "../base";
import { DeveloperError } from "../base";
import { Iterables } from "../base";
import { ContentDataTypes } from "../base";

import { TileFormats } from "../tilesets";
import { TileFormatError } from "../tilesets";

import { ContentOps } from "../tools";

import { PipelineExecutor } from "../tools";
import { Pipelines } from "../tools";

import { TilesetOperations } from "../tools";
import { TileFormatsMigration } from "../tools";
import { TilesetConverter } from "../tools";
import { TilesetJsonCreator } from "../tools";

import { FileExtensions } from "../base";

import { ToolsUtilities } from "./ToolsUtilities";
import { ContentAnalyzer } from "./ContentAnalyzer";

import { Loggers } from "../base";
const logger = Loggers.get("CLI");

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
    logger.debug(`Executing b3dmToGlb`);
    logger.debug(`  input: ${input}`);
    logger.debug(`  output: ${output}`);
    logger.debug(`  force: ${force}`);

    ToolsUtilities.ensureCanWrite(output, force);
    const inputBuffer = fs.readFileSync(input);
    const inputTileData = TileFormats.readTileData(inputBuffer);
    const outputBuffer = TileFormats.extractGlbPayload(inputTileData);
    fs.writeFileSync(output, outputBuffer);

    logger.debug(`Executing b3dmToGlb DONE`);
  }
  static async convertB3dmToGlb(input: string, output: string, force: boolean) {
    logger.debug(`Executing convertB3dmToGlb`);
    logger.debug(`  input: ${input}`);
    logger.debug(`  output: ${output}`);
    logger.debug(`  force: ${force}`);

    ToolsUtilities.ensureCanWrite(output, force);
    const inputBuffer = fs.readFileSync(input);
    const outputBuffer = await TileFormatsMigration.convertB3dmToGlb(
      inputBuffer
    );
    fs.writeFileSync(output, outputBuffer);

    logger.debug(`Executing convertB3dmToGlb DONE`);
  }
  static async convertPntsToGlb(input: string, output: string, force: boolean) {
    logger.debug(`Executing convertPntsToGlb`);
    logger.debug(`  input: ${input}`);
    logger.debug(`  output: ${output}`);
    logger.debug(`  force: ${force}`);

    ToolsUtilities.ensureCanWrite(output, force);
    const inputBuffer = fs.readFileSync(input);
    const outputBuffer = await TileFormatsMigration.convertPntsToGlb(
      inputBuffer
    );
    fs.writeFileSync(output, outputBuffer);

    logger.debug(`Executing convertPntsToGlb DONE`);
  }

  static async convertI3dmToGlb(input: string, output: string, force: boolean) {
    logger.debug(`Executing convertI3dmToGlb`);
    logger.debug(`  input: ${input}`);
    logger.debug(`  output: ${output}`);
    logger.debug(`  force: ${force}`);

    ToolsUtilities.ensureCanWrite(output, force);
    const inputBuffer = fs.readFileSync(input);

    // Prepare the resolver for external GLBs in I3DM
    const externalGlbResolver = ToolsUtilities.createResolver(input);
    const outputBuffer = await TileFormatsMigration.convertI3dmToGlb(
      inputBuffer,
      externalGlbResolver
    );
    fs.writeFileSync(output, outputBuffer);

    logger.debug(`Executing convertI3dmToGlb DONE`);
  }

  static async i3dmToGlb(input: string, output: string, force: boolean) {
    logger.debug(`Executing i3dmToGlb`);
    logger.debug(`  input: ${input}`);
    logger.debug(`  output: ${output}`);
    logger.debug(`  force: ${force}`);

    ToolsUtilities.ensureCanWrite(output, force);
    const inputBuffer = fs.readFileSync(input);
    const inputTileData = TileFormats.readTileData(inputBuffer);
    // Prepare the resolver for external GLBs in I3DM
    const externalGlbResolver = ToolsUtilities.createResolver(input);
    const outputBuffer = await TileFormats.obtainGlbPayload(
      inputTileData,
      externalGlbResolver
    );
    if (!outputBuffer) {
      throw new TileFormatError(
        `Could not resolve external GLB from I3DM file`
      );
    }
    fs.writeFileSync(output, outputBuffer);

    logger.debug(`Executing i3dmToGlb DONE`);
  }
  static async cmptToGlb(input: string, output: string, force: boolean) {
    logger.debug(`Executing cmptToGlb`);
    logger.debug(`  input: ${input}`);
    logger.debug(`  output: ${output}`);
    logger.debug(`  force: ${force}`);

    const inputBuffer = fs.readFileSync(input);
    const externalGlbResolver = ToolsUtilities.createResolver(input);
    const glbBuffers = await TileFormats.extractGlbBuffers(
      inputBuffer,
      externalGlbResolver
    );
    const glbsLength = glbBuffers.length;
    const glbPaths = Array<string>(glbsLength);
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
      ToolsUtilities.ensureCanWrite(glbPath, force);
      const glbBuffer = glbBuffers[i];
      fs.writeFileSync(glbPath, glbBuffer);
    }

    logger.debug(`Executing cmptToGlb DONE`);
  }

  static async splitCmpt(
    input: string,
    output: string,
    recursive: boolean,
    force: boolean
  ) {
    logger.debug(`Executing splitCmpt`);
    logger.debug(`  input: ${input}`);
    logger.debug(`  output: ${output}`);
    logger.debug(`  recursive: ${recursive}`);
    logger.debug(`  force: ${force}`);

    const inputBuffer = fs.readFileSync(input);
    const outputBuffers = await TileFormats.splitCmpt(inputBuffer, recursive);
    for (let i = 0; i < outputBuffers.length; i++) {
      const outputBuffer = outputBuffers[i];
      const prefix = Paths.replaceExtension(output, "");
      const extension = await FileExtensions.determineFileExtension(
        outputBuffer
      );
      if (extension === "") {
        logger.warn("Could not determine type of inner tile");
      }
      const outputPath = `${prefix}_${i}.${extension}`;
      ToolsUtilities.ensureCanWrite(outputPath, force);
      fs.writeFileSync(outputPath, outputBuffer);
    }

    logger.debug(`Executing splitCmpt DONE`);
  }

  static async glbToB3dm(input: string, output: string, force: boolean) {
    logger.debug(`Executing glbToB3dm`);
    logger.debug(`  input: ${input}`);
    logger.debug(`  output: ${output}`);
    logger.debug(`  force: ${force}`);

    ToolsUtilities.ensureCanWrite(output, force);
    const inputBuffer = fs.readFileSync(input);
    const outputTileData =
      TileFormats.createDefaultB3dmTileDataFromGlb(inputBuffer);
    const outputBuffer = TileFormats.createTileDataBuffer(outputTileData);
    fs.writeFileSync(output, outputBuffer);

    logger.debug(`Executing glbToB3dm DONE`);
  }
  static async glbToI3dm(input: string, output: string, force: boolean) {
    logger.debug(`Executing glbToI3dm`);
    logger.debug(`  input: ${input}`);
    logger.debug(`  output: ${output}`);
    logger.debug(`  force: ${force}`);

    ToolsUtilities.ensureCanWrite(output, force);
    const inputBuffer = fs.readFileSync(input);
    const outputTileData =
      TileFormats.createDefaultI3dmTileDataFromGlb(inputBuffer);
    const outputBuffer = TileFormats.createTileDataBuffer(outputTileData);
    fs.writeFileSync(output, outputBuffer);

    logger.debug(`Executing glbToI3dm DONE`);
  }
  static async optimizeB3dm(
    input: string,
    output: string,
    force: boolean,
    options: any
  ) {
    logger.debug(`Executing optimizeB3dm`);
    logger.debug(`  input: ${input}`);
    logger.debug(`  output: ${output}`);
    logger.debug(`  force: ${force}`);
    logger.debug(`  options: ${JSON.stringify(options)}`);

    ToolsUtilities.ensureCanWrite(output, force);
    const inputBuffer = fs.readFileSync(input);
    const outputBuffer = await ContentOps.optimizeB3dmBuffer(
      inputBuffer,
      options
    );
    fs.writeFileSync(output, outputBuffer);

    logger.debug(`Executing optimizeB3dm DONE`);
  }
  static async optimizeI3dm(
    input: string,
    output: string,
    force: boolean,
    options: any
  ) {
    logger.debug(`Executing optimizeI3dm`);
    logger.debug(`  input: ${input}`);
    logger.debug(`  output: ${output}`);
    logger.debug(`  force: ${force}`);
    logger.debug(`  options: ${JSON.stringify(options)}`);

    ToolsUtilities.ensureCanWrite(output, force);
    const inputBuffer = fs.readFileSync(input);
    const outputBuffer = await ContentOps.optimizeI3dmBuffer(
      inputBuffer,
      options
    );
    fs.writeFileSync(output, outputBuffer);

    logger.debug(`Executing optimizeI3dm DONE`);
  }

  static analyze(
    inputFileName: string,
    outputDirectoryName: string,
    force: boolean
  ) {
    logger.info(`Analyzing ${inputFileName}`);
    logger.info(`writing results to ${outputDirectoryName}`);

    const inputBaseName = path.basename(inputFileName);
    const inputBuffer = fs.readFileSync(inputFileName);
    ContentAnalyzer.analyze(
      inputBaseName,
      inputBuffer,
      outputDirectoryName,
      force
    );
    logger.info(`Analyzing ${inputFileName} DONE`);
  }

  private static createGzipPipelineJson(
    input: string,
    output: string,
    tilesOnly: boolean
  ) {
    let includedContentTypes: string[] | undefined = undefined;
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
    const tilesetStageJson = {
      name: "gzip",
      includedContentTypes: includedContentTypes,
      excludedContentTypes: excludedContentTypes,
    };
    const pipelineJson = {
      input: input,
      output: output,
      tilesetStages: [tilesetStageJson],
    };
    return pipelineJson;
  }

  static async gzip(
    input: string,
    output: string,
    force: boolean,
    tilesOnly: boolean
  ) {
    ToolsUtilities.ensureCanWrite(output, force);

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
    ToolsUtilities.ensureCanWrite(output, force);

    const pipelineJson = ToolsMain.createUngzipPipelineJson(input, output);
    const pipeline = Pipelines.createPipeline(pipelineJson);
    await PipelineExecutor.executePipeline(pipeline, force);
  }

  static async convert(
    input: string,
    inputTilesetJsonFileName: string | undefined,
    output: string,
    force: boolean
  ) {
    ToolsUtilities.ensureCanWrite(output, force);
    await TilesetConverter.convert(
      input,
      inputTilesetJsonFileName,
      output,
      force
    );
  }

  static async combine(input: string, output: string, force: boolean) {
    ToolsUtilities.ensureCanWrite(output, force);
    await TilesetOperations.combine(input, output, force);
  }

  static async upgrade(
    input: string,
    output: string,
    force: boolean,
    targetVersion: string,
    gltfUpgradeOptions: any
  ) {
    logger.debug(`Executing upgrade`);
    logger.debug(`  input: ${input}`);
    logger.debug(`  output: ${output}`);
    logger.debug(`  force: ${force}`);
    logger.debug(`  targetVersion: ${targetVersion}`);
    logger.debug(`  gltfUpgradeOptions: ${JSON.stringify(gltfUpgradeOptions)}`);

    ToolsUtilities.ensureCanWrite(output, force);
    await TilesetOperations.upgrade(
      input,
      output,
      force,
      targetVersion,
      gltfUpgradeOptions
    );

    logger.debug(`Executing upgrade DONE`);
  }

  static async merge(inputs: string[], output: string, force: boolean) {
    logger.debug(`Executing merge`);
    logger.debug(`  inputs: ${inputs}`);
    logger.debug(`  output: ${output}`);
    logger.debug(`  force: ${force}`);

    ToolsUtilities.ensureCanWrite(output, force);
    await TilesetOperations.merge(inputs, output, force);

    logger.debug(`Executing merge DONE`);
  }

  static async pipeline(input: string, force: boolean) {
    logger.debug(`Executing pipeline`);
    logger.debug(`  input: ${input}`);
    logger.debug(`  force: ${force}`);

    const pipelineJsonBuffer = fs.readFileSync(input);
    const pipelineJson = JSON.parse(pipelineJsonBuffer.toString());
    const pipeline = Pipelines.createPipeline(pipelineJson);
    await PipelineExecutor.executePipeline(pipeline, force);

    logger.debug(`Executing pipeline DONE`);
  }

  static async createTilesetJson(
    inputName: string,
    output: string,
    cartographicPositionDegrees: number[] | undefined,
    force: boolean
  ) {
    logger.debug(`Executing createTilesetJson`);
    logger.debug(`  inputName: ${inputName}`);
    logger.debug(`  output: ${output}`);
    logger.debug(`  force: ${force}`);

    ToolsUtilities.ensureCanWrite(output, force);
    let baseDir = inputName;
    let contentUris: string[] = [];
    if (!Paths.isDirectory(inputName)) {
      baseDir = path.dirname(inputName);
      const contentUri = path.basename(inputName);
      contentUris = [contentUri];
    } else {
      const recurse = true;
      const allFiles = Iterables.overFiles(inputName, recurse);
      contentUris = [...allFiles].map((fileName: string) =>
        Paths.relativize(inputName, fileName)
      );
    }
    logger.info(`Creating tileset JSON with content URIs: ${contentUris}`);
    const tileset = await TilesetJsonCreator.createTilesetFromContents(
      baseDir,
      contentUris
    );

    if (cartographicPositionDegrees !== undefined) {
      logger.info(
        `Creating tileset at cartographic position: ` +
          `${cartographicPositionDegrees} (in degress)`
      );
      const transform =
        TilesetJsonCreator.computeTransformFromCartographicPositionDegrees(
          cartographicPositionDegrees
        );
      tileset.root.transform = transform;
    }

    const tilesetJsonString = JSON.stringify(tileset, null, 2);
    const outputDirectory = path.dirname(output);
    Paths.ensureDirectoryExists(outputDirectory);
    fs.writeFileSync(output, Buffer.from(tilesetJsonString));

    logger.debug(`Executing createTilesetJson DONE`);
  }
}
