import fs from "fs";
import path from "path";

import { Paths } from "./base/Paths";
import { DeveloperError } from "./base/DeveloperError";
import { Buffers } from "./base/Buffers";

import { Tilesets } from "./tilesets/Tilesets";

import { TileFormats } from "./tileFormats/TileFormats";
import { TileDataLayouts } from "./tileFormats/TileDataLayouts";

import { ContentOps } from "./contentProcessing/ContentOps";
import { GltfUtilities } from "./contentProcessing/GtlfUtilities";

import { ContentDataTypes } from "./contentTypes/ContentDataTypes";

import { PipelineExecutor } from "./pipelines/PipelineExecutor";
import { Pipelines } from "./pipelines/Pipelines";

import { ZipToPackage } from "./packages/ZipToPackage";

import { TilesetSources } from "./tilesetData/TilesetSources";
import { TilesetTargets } from "./tilesetData/TilesetTargets";

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
    const upgradedOutputBuffer = await GltfUtilities.upgradeGlb(
      outputBuffer,
      undefined
    );
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
      const upgradedOutputBuffer = await GltfUtilities.upgradeGlb(
        glbBuffer,
        undefined
      );
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

  static analyze(
    inputFileName: string,
    outputDirectoryName: string,
    force: boolean
  ) {
    console.log(`Analyzing ${inputFileName}`);
    console.log(`writing results to ${outputDirectoryName}`);

    const inputBaseName = path.basename(inputFileName);
    const inputBuffer = fs.readFileSync(inputFileName);
    ToolsMain.analyzeInternal(
      inputBaseName,
      inputBuffer,
      outputDirectoryName,
      force
    );
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
        console.log(`Cannot write ${fileName}`);
        return;
      }
      console.log(`Writing ${fileName}`);
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
        console.log(`Cannot write ${fileName}`);
        return;
      }
      console.log(`Writing ${fileName}`);
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
        const innerTileBaseName = inputBaseName + ".inner[" + i + "]";
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

  static async convert(input: string, output: string, force: boolean) {
    ToolsMain.ensureCanWrite(output, force);
    const inputExtension = path.extname(input).toLowerCase();

    if (inputExtension === ".zip") {
      await ZipToPackage.convert(input, output, force);
    } else {
      const tilesetSource = TilesetSources.createAndOpen(input);
      const tilesetTarget = TilesetTargets.createAndBegin(output, force);

      const keys = tilesetSource.getKeys();
      for (const key of keys) {
        const content = tilesetSource.getValue(key);
        if (content) {
          tilesetTarget.addEntry(key, content);
        }
      }
      tilesetSource.close();
      await tilesetTarget.end();
    }
  }

  static async combine(input: string, output: string, force: boolean) {
    ToolsMain.ensureCanWrite(output, force);
    await Tilesets.combine(input, output, force);
  }

  static async upgrade(
    input: string,
    output: string,
    force: boolean,
    gltfUpgradeOptions: any
  ) {
    ToolsMain.ensureCanWrite(output, force);
    await Tilesets.upgrade(input, output, force, gltfUpgradeOptions);
  }

  static async merge(inputs: string[], output: string, force: boolean) {
    ToolsMain.ensureCanWrite(output, force);
    await Tilesets.merge(inputs, output, force);
  }

  static async pipeline(input: string, force: boolean) {
    const pipelineJsonBuffer = fs.readFileSync(input);
    const pipelineJson = JSON.parse(pipelineJsonBuffer.toString());
    const pipeline = Pipelines.createPipeline(pipelineJson);
    await PipelineExecutor.executePipeline(pipeline, force);
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
