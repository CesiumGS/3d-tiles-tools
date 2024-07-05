import fs from "fs";
import path from "path";

import { Paths } from "../base";
import { DeveloperError } from "../base";
import { Buffers } from "../base";
import { Iterables } from "../base";
import { ContentDataTypes } from "../base";

import { TileFormats } from "../tilesets";
import { TileDataLayouts } from "../tilesets";
import { TileFormatError } from "../tilesets";

import { ContentOps } from "../tools";
import { GltfUtilities } from "../tools";

import { PipelineExecutor } from "../tools";
import { Pipelines } from "../tools";

import { TilesetOperations } from "../tools";
import { TileFormatsMigration } from "../tools";
import { TilesetConverter } from "../tools";
import { TilesetJsonCreator } from "../tools";

import { ContentDataTypeRegistry } from "../base";

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

    ToolsMain.ensureCanWrite(output, force);
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

    ToolsMain.ensureCanWrite(output, force);
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

    ToolsMain.ensureCanWrite(output, force);
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

    ToolsMain.ensureCanWrite(output, force);
    const inputBuffer = fs.readFileSync(input);

    // Prepare the resolver for external GLBs in I3DM
    const externalGlbResolver = ToolsMain.createResolver(input);
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

    ToolsMain.ensureCanWrite(output, force);
    const inputBuffer = fs.readFileSync(input);
    const inputTileData = TileFormats.readTileData(inputBuffer);
    // Prepare the resolver for external GLBs in I3DM
    const externalGlbResolver = ToolsMain.createResolver(input);
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
    const externalGlbResolver = ToolsMain.createResolver(input);
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
      ToolsMain.ensureCanWrite(glbPath, force);
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
      const extension = await ToolsMain.determineFileExtension(outputBuffer);
      const outputPath = `${prefix}_${i}.${extension}`;
      ToolsMain.ensureCanWrite(outputPath, force);
      fs.writeFileSync(outputPath, outputBuffer);
    }

    logger.debug(`Executing splitCmpt DONE`);
  }

  private static async determineFileExtension(data: Buffer): Promise<string> {
    const type = await ContentDataTypeRegistry.findType("", data);
    switch (type) {
      case ContentDataTypes.CONTENT_TYPE_B3DM:
        return "b3dm";
      case ContentDataTypes.CONTENT_TYPE_I3DM:
        return "i3dm";
      case ContentDataTypes.CONTENT_TYPE_PNTS:
        return "pnts";
      case ContentDataTypes.CONTENT_TYPE_CMPT:
        return "cmpt";
    }
    logger.warn("Could not determine type of inner tile");
    return "UNKNOWN";
  }

  static async glbToB3dm(input: string, output: string, force: boolean) {
    logger.debug(`Executing glbToB3dm`);
    logger.debug(`  input: ${input}`);
    logger.debug(`  output: ${output}`);
    logger.debug(`  force: ${force}`);

    ToolsMain.ensureCanWrite(output, force);
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

    ToolsMain.ensureCanWrite(output, force);
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

    ToolsMain.ensureCanWrite(output, force);
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

    ToolsMain.ensureCanWrite(output, force);
    const inputBuffer = fs.readFileSync(input);
    const outputBuffer = await ContentOps.optimizeI3dmBuffer(
      inputBuffer,
      options
    );
    fs.writeFileSync(output, outputBuffer);

    logger.debug(`Executing optimizeI3dm DONE`);
  }

  static updateAlignment(input: string, output: string, force: boolean) {
    logger.debug(`Executing updateAlignment`);
    logger.debug(`  input: ${input}`);
    logger.debug(`  output: ${output}`);
    logger.debug(`  force: ${force}`);

    ToolsMain.ensureCanWrite(output, force);
    const inputBuffer = fs.readFileSync(input);
    const outputBuffer = ContentOps.updateAlignment(inputBuffer);
    fs.writeFileSync(output, outputBuffer);

    logger.debug(`Executing updateAlignment DONE`);
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
    ToolsMain.analyzeInternal(
      inputBaseName,
      inputBuffer,
      outputDirectoryName,
      force
    );
    logger.info(`Analyzing ${inputFileName} DONE`);
  }
  static analyzeInternal(
    inputBaseName: string,
    inputBuffer: Buffer,
    outputDirectoryName: string,
    force: boolean
  ) {
    // A function to create a JSON string from an
    // object. The formatting will be controlled
    // via a command line flag in the future.
    const doFormatJson = true;
    const stringify = (input: any) => {
      if (doFormatJson) {
        return JSON.stringify(input, null, 2);
      }
      return JSON.stringify(input);
    };

    // A function to write a JSON string to a file, if
    // the JSON string does not represent an empty
    // object, and if the file can be written.
    const writeJsonFileOptional = (jsonString: string, fileName: string) => {
      if (jsonString === "{}") {
        return;
      }
      if (!ToolsMain.canWrite(fileName, force)) {
        logger.error(`Cannot write ${fileName}`);
        return;
      }
      logger.info(`Writing ${fileName}`);
      fs.writeFileSync(fileName, Buffer.from(jsonString));
    };

    // A function to write a buffer to a file, if
    // the buffer is not empty, and if the file
    // can be written.
    const writeFileOptional = (buffer: Buffer, fileName: string) => {
      if (buffer.length === 0) {
        return;
      }
      if (!ToolsMain.canWrite(fileName, force)) {
        logger.error(`Cannot write ${fileName}`);
        return;
      }
      logger.info(`Writing ${fileName}`);
      fs.writeFileSync(fileName, buffer);
    };

    // Read the buffer and its magic header
    const magic = Buffers.getMagicString(inputBuffer, 0);

    if (magic === "b3dm" || magic === "i3dm" || magic === "pnts") {
      // Handle the basic legacy tile formats
      const tileDataLayout = TileDataLayouts.create(inputBuffer);
      const tileData = TileFormats.extractTileData(inputBuffer, tileDataLayout);

      // Create the JSON strings for the layout information,
      // feature table, batch table, and the GLB JSON
      const layoutJsonString = stringify(tileDataLayout);
      const featureTableJsonString = stringify(tileData.featureTable.json);
      const batchTableJsonString = stringify(tileData.batchTable.json);
      let glbJsonString = "{}";
      if (tileData.payload.length !== 0) {
        const glbJsonBuffer = GltfUtilities.extractJsonFromGlb(
          tileData.payload
        );
        glbJsonString = glbJsonBuffer.toString();
      }
      if (doFormatJson) {
        const glbJson = JSON.parse(glbJsonString);
        glbJsonString = stringify(glbJson);
      }

      // Determine the output file names. They are files in the
      // output directory, prefixed with the name of the input
      // file, and with suffixes that indicate the actual contents
      const outputBaseName = Paths.resolve(outputDirectoryName, inputBaseName);
      const layoutFileName = outputBaseName + ".layout.json";
      const featureTableJsonFileName = outputBaseName + ".featureTable.json";
      const batchTableJsonFileName = outputBaseName + ".batchTable.json";
      const glbFileName = outputBaseName + ".glb";
      const glbJsonFileName = outputBaseName + ".glb.json";

      // Write all output files
      Paths.ensureDirectoryExists(outputDirectoryName);
      writeJsonFileOptional(layoutJsonString, layoutFileName);
      writeFileOptional(tileData.payload, glbFileName);
      writeJsonFileOptional(featureTableJsonString, featureTableJsonFileName);
      writeJsonFileOptional(batchTableJsonString, batchTableJsonFileName);
      writeJsonFileOptional(glbJsonString, glbJsonFileName);
    } else if (magic === "cmpt") {
      // Handle composite tiles
      const compositeTileData = TileFormats.readCompositeTileData(inputBuffer);
      const n = compositeTileData.innerTileBuffers.length;
      for (let i = 0; i < n; i++) {
        const innerTileDataBuffer = compositeTileData.innerTileBuffers[i];
        const innerTileBaseName = `${inputBaseName}.inner[${i}]`;
        ToolsMain.analyzeInternal(
          innerTileBaseName,
          innerTileDataBuffer,
          outputDirectoryName,
          force
        );
      }
    } else if (magic === "glTF") {
      // Handle GLB files
      let glbJsonString = "{}";
      const glbJsonBuffer = GltfUtilities.extractJsonFromGlb(inputBuffer);
      glbJsonString = glbJsonBuffer.toString();
      if (doFormatJson) {
        const glbJson = JSON.parse(glbJsonString);
        glbJsonString = stringify(glbJson);
      }
      const outputBaseName = Paths.resolve(outputDirectoryName, inputBaseName);
      const glbJsonFileName = outputBaseName + ".glb.json";
      Paths.ensureDirectoryExists(outputDirectoryName);
      writeJsonFileOptional(glbJsonString, glbJsonFileName);
    }
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

  static async convert(
    input: string,
    inputTilesetJsonFileName: string | undefined,
    output: string,
    force: boolean
  ) {
    ToolsMain.ensureCanWrite(output, force);
    await TilesetConverter.convert(
      input,
      inputTilesetJsonFileName,
      output,
      force
    );
  }

  static async combine(input: string, output: string, force: boolean) {
    ToolsMain.ensureCanWrite(output, force);
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

    ToolsMain.ensureCanWrite(output, force);
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

    ToolsMain.ensureCanWrite(output, force);
    await TilesetOperations.merge(inputs, output, force);

    logger.debug(`Executing merge DONE`);
  }

  static async mergeJson(inputs: string[], output: string, force: boolean) {
    logger.debug(`Executing mergeJson`);
    logger.debug(`  inputs: ${inputs}`);
    logger.debug(`  output: ${output}`);
    logger.debug(`  force: ${force}`);

    ToolsMain.ensureCanWrite(output, force);
    await TilesetOperations.mergeJson(inputs, output, force);

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

    ToolsMain.ensureCanWrite(output, force);
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

  /**
   * Creates a function that can resolve URIs relative to
   * the given input file.
   *
   * The function will resolve relative URIs against the
   * base directory of the given input file name, and
   * return the corresponding file data. If the data
   * cannot be read, then the function will print an
   * error message and return  `undefined`.
   *
   * @param input - The input file name
   * @returns The resolver function
   */
  private static createResolver(
    input: string
  ): (uri: string) => Promise<Buffer | undefined> {
    const baseDir = path.dirname(input);
    const resolver = async (uri: string): Promise<Buffer | undefined> => {
      const externalGlbUri = path.resolve(baseDir, uri);
      try {
        return fs.readFileSync(externalGlbUri);
      } catch (error) {
        logger.error(`Could not resolve ${uri} against ${baseDir}`);
      }
    };
    return resolver;
  }

  /**
   * Returns whether the specified file can be written.
   *
   * This is the case when `force` is `true`, or when it does not
   * exist yet.
   *
   * @param fileName - The file name
   * @param force The 'force' flag state from the command line
   * @returns Whether the file can be written
   */
  static canWrite(fileName: string, force: boolean): boolean {
    if (force) {
      return true;
    }
    if (!fs.existsSync(fileName)) {
      return true;
    }
    return false;
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
    if (ToolsMain.canWrite(fileName, force)) {
      return true;
    }
    throw new DeveloperError(
      `File ${fileName} already exists. Specify -f or --force to overwrite existing files.`
    );
  }
}
