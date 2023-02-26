import { Tile } from "../structure/Tile";
import { Tileset } from "../structure/Tileset";

import { TilesetError } from "../tilesetData/TilesetError";
import { TilesetSource } from "../tilesetData/TilesetSource";
import { TilesetTarget } from "../tilesetData/TilesetTarget";
import { TilesetTargets } from "../tilesetData/TilesetTargets";
import { TilesetSources } from "../tilesetData/TilesetSources";

import { Contents } from "../tilesets/Contents";
import { Tiles } from "../tilesets/Tiles";
import { Tilesets } from "../tilesets/Tilesets";
import { DeveloperError } from "../base/DeveloperError";
import { TileFormats } from "../tileFormats/TileFormats";
import { GltfUtilities } from "../contentOperations/GtlfUtilities";
import { BufferedContentData } from "../contentTypes/BufferedContentData";
import { ContentDataTypeRegistry } from "../contentTypes/ContentDataTypeRegistry";

/**
 * A class for "upgrading" a tileset from a previous version to
 * a more recent version. The details of what that means exactly
 * are not (yet) specified.
 */
export class TilesetUpgrader {
  /**
   * A function that will receive log messages during the upgrade process
   */
  private readonly logCallback: (message: any) => void;

  /**
   * The tileset source for the input
   */
  private tilesetSource: TilesetSource | undefined;

  /**
   * The tileset target for the output.
   */
  private tilesetTarget: TilesetTarget | undefined;

  private readonly upgradeOptions: any;

  /**
   * Creates a new instance
   */
  constructor() {
    this.logCallback = (message: any) => console.log(message);

    this.upgradeOptions = {
      upgradeContentUrlToUri: true,
      upgradeB3dmGltf1ToGltf2: true,
      upgradeI3dmGltf1ToGltf2: true,
    };
  }

  /**
   * Upgrade the specified source tileset, and write it to the given
   * target.
   *
   * @param tilesetSourceName - The tileset source name
   * @param tilesetTargetName - The tileset target name
   * @param overwrite Whether the target should be overwritten if
   * it already exists
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed,
   * or when the output already exists and `overwrite` was `false`.
   */
  async upgrade(
    tilesetSourceName: string,
    tilesetTargetName: string,
    overwrite: boolean
  ): Promise<void> {
    const tilesetSource = TilesetSources.createAndOpen(tilesetSourceName);
    const tilesetTarget = TilesetTargets.createAndBegin(
      tilesetTargetName,
      overwrite
    );

    this.tilesetSource = tilesetSource;
    this.tilesetTarget = tilesetTarget;

    const tilesetSourceJsonFileName =
      Tilesets.determineTilesetJsonFileName(tilesetSourceName);

    const tilesetTargetJsonFileName =
      Tilesets.determineTilesetJsonFileName(tilesetTargetName);

    await this.upgradeInternal(
      tilesetSourceJsonFileName,
      tilesetTargetJsonFileName
    );

    // Copy the resources only when the source and target are
    // in fact different packages (directories)
    const equalPackages = Tilesets.areEqualPackages(
      tilesetSourceName,
      tilesetTargetName
    );
    if (equalPackages) {
      console.log(
        `Not copying resources - ${tilesetSourceName} and ` +
          `${tilesetTargetName} refer to the same package`
      );
    } else {
      this.copyResources(tilesetSourceJsonFileName);
    }

    tilesetSource.close();
    await tilesetTarget.end();

    this.tilesetSource = undefined;
    this.tilesetTarget = undefined;
  }

  /**
   * Internal method for the actual upgrade.
   *
   * It justo obtains the tileset JSON data from the source, passes
   * it to `upgradeTileset`, and writes the result under the given
   * name into the target.
   *
   * @param tilesetSourceJsonFileName - The name of the tileset JSON in the source
   * @param tilesetTargetJsonFileName - The name of the tileset JSON in the target
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed
   */
  private async upgradeInternal(
    tilesetSourceJsonFileName: string,
    tilesetTargetJsonFileName: string
  ): Promise<void> {
    if (!this.tilesetSource || !this.tilesetTarget) {
      throw new DeveloperError("The source and target must be defined");
    }

    const tilesetJsonBuffer = this.tilesetSource.getValue(
      tilesetSourceJsonFileName
    );
    if (!tilesetJsonBuffer) {
      const message = `No ${tilesetSourceJsonFileName} found in input`;
      throw new TilesetError(message);
    }
    const tileset = JSON.parse(tilesetJsonBuffer.toString()) as Tileset;

    await this.upgradeTileset(tileset);

    const resultTilesetJsonString = JSON.stringify(tileset, null, 2);
    const resultTilesetJsonBuffer = Buffer.from(resultTilesetJsonString);
    this.tilesetTarget.addEntry(
      tilesetTargetJsonFileName,
      resultTilesetJsonBuffer
    );
  }

  /**
   * Upgrades the given tileset, in place.
   *
   * @param tileset - The parsed tileset
   */
  async upgradeTileset(tileset: Tileset): Promise<void> {
    // TODO: There only is one operation right now, on the
    // level of JSON. Further upgrade steps may be added here.
    if (this.upgradeOptions.upgradeContentUrlToUri) {
      TilesetUpgrader.upgradeContentUrlToUri(tileset, this.logCallback);
    }
  }

  /**
   * Upgrade the `url` property of each tile content to `uri`.
   *
   * This will examine each `tile.content` in the explicit representation
   * of the tile hierarchy in the given tileset. If any content does not
   * define a `uri`, but a (legacy) `url` property, then a warning is
   * printed and the `url` is renamed to `uri`.
   *
   * @param tileset - The tiles
   * @param logCallback - A callback for log messages
   */
  private static upgradeContentUrlToUri(
    tileset: Tileset,
    logCallback: (message: any) => void
  ) {
    const root = tileset.root;
    Tiles.traverseExplicit(root, async (tilePath: Tile[]) => {
      const tile = tilePath[tilePath.length - 1];
      if (tile.content) {
        Contents.upgradeUrlToUri(tile.content, logCallback);
      }
      if (tile.contents) {
        for (const content of tile.contents) {
          Contents.upgradeUrlToUri(content, logCallback);
        }
      }
      return true;
    });
  }

  /**
   * Copy all elements from the tileset source to the tileset target,
   * except for the one that has the given name.
   *
   * @param tilesetSourceJsonFileName - The name of the tileset JSON
   * file in the source.
   */
  private copyResources(tilesetSourceJsonFileName: string): void {
    if (!this.tilesetSource || !this.tilesetTarget) {
      throw new DeveloperError("The source and target must be defined");
    }
    const entries = TilesetSources.getEntries(this.tilesetSource);
    for (const entry of entries) {
      const key = entry.key;
      if (key === tilesetSourceJsonFileName) {
        continue;
      }
      this.tilesetTarget.addEntry(key, entry.value);
    }
  }

  private static async upgradeB3dmGltf1ToGltf2(
    inputBuffer: Buffer
  ): Promise<Buffer> {
    const inputTileData = TileFormats.readTileData(inputBuffer);
    const inputGlb = inputTileData.payload;
    const outputGlb = await GltfUtilities.upgradeGlb(inputGlb);
    const outputTileData = TileFormats.createB3dmTileDataFromGlb(
      outputGlb,
      inputTileData.featureTable.json,
      inputTileData.featureTable.binary,
      inputTileData.batchTable.json,
      inputTileData.batchTable.binary
    );
    const outputBuffer = TileFormats.createTileDataBuffer(outputTileData);
    return outputBuffer;
  }

  private static async upgradeI3dmGltf1ToGltf2(
    inputBuffer: Buffer
  ): Promise<Buffer> {
    const inputTileData = TileFormats.readTileData(inputBuffer);
    const inputGlb = inputTileData.payload;
    const outputGlb = await GltfUtilities.upgradeGlb(inputGlb);
    const outputTileData = TileFormats.createI3dmTileDataFromGlb(
      outputGlb,
      inputTileData.featureTable.json,
      inputTileData.featureTable.binary,
      inputTileData.batchTable.json,
      inputTileData.batchTable.binary
    );
    const outputBuffer = TileFormats.createTileDataBuffer(outputTileData);
    return outputBuffer;
  }

  private async upgradeResources(
    tilesetSourceJsonFileName: string
  ): Promise<void> {
    if (!this.tilesetSource || !this.tilesetTarget) {
      throw new DeveloperError("The source and target must be defined");
    }
    const entries = TilesetSources.getEntries(this.tilesetSource);
    for (const entry of entries) {
      const key = entry.key;
      if (key === tilesetSourceJsonFileName) {
        continue;
      }
      let value = entry.value;

      const contentData = new BufferedContentData(key, value);
      const type = await ContentDataTypeRegistry.findContentDataType(
        contentData
      );
      value = await this.processValue(key, value, type);

      this.tilesetTarget.addEntry(key, value);
    }
  }

  private async processValue(
    key: string,
    value: Buffer,
    type: string | undefined
  ): Promise<Buffer> {
    if (type === "CONTENT_TYPE_B3DM") {
      if (this.upgradeOptions.upgradeB3dmGltf1ToGltf2) {
        console.log("Upgrading GLB in " + key);
        value = await TilesetUpgrader.upgradeB3dmGltf1ToGltf2(value);
      } else {
        console.log("Not upgrading " + key + " (disabled via option)");
      }
    } else if (type === "CONTENT_TYPE_I3DM") {
      if (this.upgradeOptions.upgradeI3dmGltf1ToGltf2) {
        console.log("Upgrading GLB in " + key);
        value = await TilesetUpgrader.upgradeI3dmGltf1ToGltf2(value);
      } else {
        console.log("Not upgrading " + key + " (disabled via option)");
      }
    } else {
      console.log("Not upgrading " + key + " with type " + type);
    }
    return value;
  }
}
