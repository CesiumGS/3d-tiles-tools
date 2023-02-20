import fs from "fs";

import { DeveloperError } from "./base/DeveloperError";
import { Paths } from "./base/Paths";
import { ContentOps } from "./contentOperations/ContentOps";
import { GltfUtilities } from "./contentOperations/GtlfUtilities";
import { TileFormats } from "./tileFormats/TileFormats";

export class ToolsMain {
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

  /*
  } else if (command === 'optimizeB3dm') {
      return readAndOptimizeB3dm(input, output, force, optionArgs);
  } else if (command === 'optimizeI3dm') {
      return readAndOptimizeI3dm(input, output, force, optionArgs);
  } else if (command === 'tilesetToDatabase') {
      return convertTilesetToDatabase(input, output, force);
  } else if (command === 'databaseToTileset') {
      return convertDatabaseToTileset(input, output, force);
  }
  throw new DeveloperError(`Invalid command: ${  command}`);  
  */
}
