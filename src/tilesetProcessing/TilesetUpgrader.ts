import { Buffers } from "../base/Buffers";
import { DeveloperError } from "../base/DeveloperError";

import { BufferedContentData } from "../contentTypes/BufferedContentData";
import { ContentDataTypeRegistry } from "../contentTypes/ContentDataTypeRegistry";
import { ContentDataTypes } from "../contentTypes/ContentDataTypes";

import { Tileset } from "../structure/Tileset";

import { TilesetError } from "../tilesetData/TilesetError";
import { TilesetSource } from "../tilesetData/TilesetSource";
import { TilesetTarget } from "../tilesetData/TilesetTarget";
import { TilesetTargets } from "../tilesetData/TilesetTargets";
import { TilesetSources } from "../tilesetData/TilesetSources";

import { Tilesets } from "../tilesets/Tilesets";

import { TilesetUpgradeOptions } from "./upgrade/TilesetUpgradeOptions";
import { TilesetObjectUpgrader } from "./upgrade/TilesetObjectUpgrader";

import { ContentUpgrades } from "../contentProcessing/ContentUpgrades";

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

  /**
   * The options for the upgrade.
   */
  private readonly upgradeOptions: TilesetUpgradeOptions;

  /**
   * The options that may be passed to `gltf-pipeline` when
   * GLB data in B3DM or I3DM is supposed to be upgraded.
   */
  private readonly gltfUpgradeOptions: any;

  /**
   * Creates a new instance
   *
   * @param quiet - Whether log messages should be omitted
   * @param gltfUpgradeOptions - Options that may be passed
   * to `gltf-pipeline` when GLB data in B3DM or I3DM is
   * supposed to be upgraded.
   */
  constructor(quiet: boolean, gltfUpgradeOptions: any) {
    if (quiet !== true) {
      this.logCallback = (message: any) => console.log(message);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
      this.logCallback = (message: any) => {};
    }
    this.gltfUpgradeOptions = gltfUpgradeOptions;

    // By default, ALL options are enabled...
    this.upgradeOptions = {
      upgradeExternalTilesets: true,

      upgradeAssetVersionNumber: true,
      upgradeRefineCase: true,
      upgradeContentUrlToUri: true,
      upgradeExtensionDeclarations: true,

      upgradeB3dmGltf1ToGltf2: true,
      upgradeI3dmGltf1ToGltf2: true,

      // EXCEPT for the experimental ones...
      upgradePntsToGlb: false,
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

    const upgradedTilesetJsonBuffer = await this.upgradeInternal(
      tilesetSourceJsonFileName
    );
    this.tilesetTarget.addEntry(
      tilesetTargetJsonFileName,
      upgradedTilesetJsonBuffer
    );
    await this.upgradeResources(tilesetSourceJsonFileName);

    tilesetSource.close();
    await tilesetTarget.end();

    this.tilesetSource = undefined;
    this.tilesetTarget = undefined;
  }

  /**
   * Internal method for the actual upgrade.
   *
   * It just obtains the tileset JSON data from the source, passes
   * it to `upgradeTileset`, and returns the buffer containing the
   * JSON data of the upgraded result.
   *
   * @param tilesetSourceJsonFileName - The name of the tileset JSON in the source
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed
   */
  private async upgradeInternal(
    tilesetSourceJsonFileName: string
  ): Promise<Buffer> {
    if (!this.tilesetSource || !this.tilesetTarget) {
      throw new DeveloperError("The source and target must be defined");
    }

    // Obtain the tileset JSON buffer (unzip it if necessary)
    // and parse the Tileset out of it
    let tilesetJsonBuffer = this.tilesetSource.getValue(
      tilesetSourceJsonFileName
    );
    if (!tilesetJsonBuffer) {
      const message = `No ${tilesetSourceJsonFileName} found in input`;
      throw new TilesetError(message);
    }
    let tilesetJsonBufferWasZipped = false;
    if (Buffers.isGzipped(tilesetJsonBuffer)) {
      tilesetJsonBufferWasZipped = true;
      tilesetJsonBuffer = Buffers.gunzip(tilesetJsonBuffer);
    }
    const tileset = JSON.parse(tilesetJsonBuffer.toString()) as Tileset;
    await this.upgradeTileset(tileset);

    // Put the upgraded tileset JSON buffer into the target
    // (zipping it, if the input was zipped)
    const resultTilesetJsonString = JSON.stringify(tileset, null, 2);
    let resultTilesetJsonBuffer = Buffer.from(resultTilesetJsonString);
    if (tilesetJsonBufferWasZipped) {
      resultTilesetJsonBuffer = Buffers.gzip(resultTilesetJsonBuffer);
    }
    return resultTilesetJsonBuffer;
  }

  /**
   * Perform the upgrade of the `Tileset` object, in place.
   *
   * @param tileset The `Tileset` object
   */
  async upgradeTileset(tileset: Tileset) {
    const tilesetObjectUpgrader = new TilesetObjectUpgrader(
      this.upgradeOptions,
      this.logCallback
    );
    await tilesetObjectUpgrader.upgradeTilesetObject(tileset);
  }

  /**
   * Upgrade all resources from the tileset source (except for the
   * file with the given name) and put them into the tileset target.
   *
   * @param tilesetSourceJsonFileName - The name of the tileset JSON file
   * in the source
   * @returns A promise that resolves when the process is finished.
   */
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
      const sourceValue = entry.value;
      const contentData = new BufferedContentData(key, sourceValue);
      const type = await ContentDataTypeRegistry.findContentDataType(
        contentData
      );
      const targetValue = await this.processValue(key, sourceValue, type);
      this.tilesetTarget.addEntry(key, targetValue);
    }
  }

  /**
   * Process the value of an entry (i.e. the data of one file), and return
   * a possibly "upgraded" version of that value.
   *
   * @param key - The key (file name)
   * @param value - The value (file contents buffer)
   * @param type - The type of the content. See `ContentDataTypes`.
   * @returns A promise that resolves when the value is processed.
   */
  private async processValue(
    key: string,
    value: Buffer,
    type: string | undefined
  ): Promise<Buffer> {
    if (type === ContentDataTypes.CONTENT_TYPE_B3DM) {
      if (this.upgradeOptions.upgradeB3dmGltf1ToGltf2) {
        this.logCallback(`  Upgrading GLB in ${key}`);
        value = await ContentUpgrades.upgradeB3dmGltf1ToGltf2(
          value,
          this.gltfUpgradeOptions
        );
      } else {
        this.logCallback(`  Not upgrading GLB in ${key} (disabled via option)`);
      }
    } else if (type === ContentDataTypes.CONTENT_TYPE_I3DM) {
      if (this.upgradeOptions.upgradeI3dmGltf1ToGltf2) {
        this.logCallback(`  Upgrading GLB in ${key}`);
        value = await ContentUpgrades.upgradeI3dmGltf1ToGltf2(
          value,
          this.gltfUpgradeOptions
        );
      } else {
        this.logCallback(`  Not upgrading GLB in ${key} (disabled via option)`);
      }
    } else if (type == ContentDataTypes.CONTENT_TYPE_TILESET) {
      if (this.upgradeOptions.upgradeExternalTilesets) {
        this.logCallback(`  Upgrading external tileset in ${key}`);
        value = await this.upgradeInternal(key);
      } else {
        this.logCallback(
          `  Not upgrading external tileset in ${key} (disabled via option)`
        );
      }
    } else {
      this.logCallback(`  No upgrade operation to perform for ${key}`);
    }
    return value;
  }
}
