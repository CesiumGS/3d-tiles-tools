import { Paths } from "../base/Paths";
import { DeveloperError } from "../base/DeveloperError";

import { ContentDataTypes } from "../contentTypes/ContentDataTypes";

import { Tileset } from "../structure/Tileset";
import { Schema } from "../structure/Metadata/Schema";

import { TilesetUpgradeOptions } from "./upgrade/TilesetUpgradeOptions";
import { TilesetObjectUpgrader } from "./upgrade/TilesetObjectUpgrader";

import { ContentUpgrades } from "../contentProcessing/ContentUpgrades";

import { BasicTilesetProcessor } from "./BasicTilesetProcessor";

import { TilesetEntry } from "../tilesetData/TilesetEntry";

import { TileFormatsMigration } from "../migration/TileFormatsMigration";

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
   * @param targetVersion - The target version - 1.0 or 1.1
   * @param gltfUpgradeOptions - Options that may be passed
   * to `gltf-pipeline` when GLB data in B3DM or I3DM is
   * supposed to be upgraded.
   * @throws DeveloperError If the version is neither 1.0 nor 1.1
   */
  constructor(quiet: boolean, targetVersion: string, gltfUpgradeOptions: any) {
    if (quiet !== true) {
      this.logCallback = (message: any) => console.log(message);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
      this.logCallback = (message: any) => {};
    }
    this.gltfUpgradeOptions = gltfUpgradeOptions;
    this.upgradeOptions = TilesetUpgrader.optionsFor(targetVersion);
  }

  /**
   * Creates pre-configured `TilesetUpgradeOptions` for the given
   * target version.
   *
   * @param version - The target version - 1.0 or 1.1
   * @returns The `TilesetUpgradeOptions`
   */
  private static optionsFor(version: string): TilesetUpgradeOptions {
    if (version === "1.0") {
      const options: TilesetUpgradeOptions = {
        upgradeExternalTilesets: true,

        upgradedAssetVersionNumber: "1.0",
        upgradeRefineCase: true,
        upgradeContentUrlToUri: true,

        upgradeContentGltfExtensionDeclarations: false,

        upgradeB3dmGltf1ToGltf2: true,
        upgradeI3dmGltf1ToGltf2: true,

        upgradePntsToGlb: false,
        upgradeB3dmToGlb: false,
      };
      return options;
    }
    if (version === "1.1") {
      const options: TilesetUpgradeOptions = {
        upgradeExternalTilesets: true,

        upgradedAssetVersionNumber: "1.1",
        upgradeRefineCase: true,
        upgradeContentUrlToUri: true,
        upgradeContentGltfExtensionDeclarations: true,

        upgradeB3dmGltf1ToGltf2: false,
        upgradeI3dmGltf1ToGltf2: false,

        upgradePntsToGlb: true,
        upgradeB3dmToGlb: true,
      };
      return options;
    }
    throw new DeveloperError(
      `Invalid target version ${version} - ` +
        `only '1.0' and '1.1' are allowed`
    );
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
    const quiet = true;
    const processExternalTilesets = this.upgradeOptions.upgradeExternalTilesets;
    const tilesetProcessor = new BasicTilesetProcessor(
      quiet,
      processExternalTilesets
    );
    await tilesetProcessor.begin(
      tilesetSourceName,
      tilesetTargetName,
      overwrite
    );

    // Perform the upgrade for the actual tileset object
    tilesetProcessor.forTileset(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (tileset: Tileset, schema: Schema | undefined) => {
        await this.upgradeTileset(tileset);
        return tileset;
      }
    );

    // Perform the updates for the tile contents
    await this.performContentUpgrades(tilesetProcessor);
    await tilesetProcessor.end();
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
   * Perform the upgrades of the tile contents, by processing all
   * content URIs with the `processContentUri`, and all content
   * values (files) with `processEntry`
   *
   * @param tilesetProcessor - The `BasicTilesetProcessor` that
   * will process the entries
   */
  private async performContentUpgrades(
    tilesetProcessor: BasicTilesetProcessor
  ): Promise<void> {
    await tilesetProcessor.processTileContentEntries(
      this.processContentUri,
      this.processEntry
    );
  }

  /**
   * Process the given content URI.
   *
   * The given URI may either be an actual content URI, or a
   * template URI. Depending on the upgrade options, this
   * may change the file extension in the URI.
   *
   * @param uri - The URI
   * @returns The processed URI
   */
  private processContentUri = (uri: string) => {
    // Note: There is no way to establish a clear connection
    // between a URI and the type of the tile contents that
    // it refers to. A template URI that has NO extension
    // could even refer to a mix of different content types.
    // The following is a best-effort approach to change the
    // file extensions, if present, depending on the update
    // options that are enabled.

    if (this.upgradeOptions.upgradePntsToGlb) {
      if (Paths.hasExtension(uri, ".pnts")) {
        return Paths.replaceExtension(uri, ".glb");
      }
      return uri;
    }
    if (this.upgradeOptions.upgradeB3dmToGlb) {
      if (Paths.hasExtension(uri, ".b3dm")) {
        return Paths.replaceExtension(uri, ".glb");
      }
      return uri;
    }
    return uri;
  };

  /**
   * Process the given tileset (content) entry, and return the result.
   *
   * @param sourceEntry - The source entry
   * @param type The `ContentDataType` of the source entry
   * @returns The processed entry
   */
  private processEntry = async (
    sourceEntry: TilesetEntry,
    type: string | undefined
  ): Promise<TilesetEntry> => {
    // Some of the more complex upgrade operations (like B3DM to
    // glTF+Metadata) may fail for many reasons. Such a failure
    // should not cause the whole process to fail. Therefore,
    // this case is handled here by printing an error message
    // and returning the source data, hopefully producing a
    // tileset that is still valid:
    try {
      return await this.processEntryUnchecked(sourceEntry, type);
    } catch (error) {
      const sourceKey = sourceEntry.key;
      this.logCallback(`Failed to upgrade ${sourceKey}: ${error}`);
      this.logCallback(error);
      const targetKey = this.processContentUri(sourceKey);
      const targetEntry = {
        key: targetKey,
        value: sourceEntry.value,
      };
      return targetEntry;
    }
  };

  /**
   * Process the given tileset (content) entry, and return the result.
   *
   * @param sourceEntry - The source entry
   * @param type The `ContentDataType` of the source entry
   * @returns The processed entry
   */
  private processEntryUnchecked = async (
    sourceEntry: TilesetEntry,
    type: string | undefined
  ): Promise<TilesetEntry> => {
    if (type === ContentDataTypes.CONTENT_TYPE_PNTS) {
      return this.processEntryPnts(sourceEntry);
    }
    if (type === ContentDataTypes.CONTENT_TYPE_B3DM) {
      return this.processEntryB3dm(sourceEntry);
    } else if (type === ContentDataTypes.CONTENT_TYPE_I3DM) {
      return this.processEntryI3dm(sourceEntry);
    } else if (type == ContentDataTypes.CONTENT_TYPE_TILESET) {
      return this.processEntryTileset(sourceEntry);
    }
    this.logCallback(
      `  No upgrade operation to perform for ${sourceEntry.key}`
    );
    return sourceEntry;
  };

  /**
   * Process the given tileset (content) entry that contains PNTS,
   * and return the result.
   *
   * @param sourceEntry - The source entry
   * @returns The processed entry
   */
  private processEntryPnts = async (
    sourceEntry: TilesetEntry
  ): Promise<TilesetEntry> => {
    const sourceKey = sourceEntry.key;
    const sourceValue = sourceEntry.value;
    let targetKey = sourceKey;
    let targetValue = sourceValue;
    if (this.upgradeOptions.upgradePntsToGlb) {
      this.logCallback(`  Upgrading PNTS to GLB for ${sourceKey}`);

      targetKey = this.processContentUri(sourceKey);
      targetValue = await TileFormatsMigration.convertPntsToGlb(sourceValue);
    } else {
      this.logCallback(`  Not upgrading ${sourceKey} (disabled via option)`);
    }
    const targetEntry = {
      key: targetKey,
      value: targetValue,
    };
    return targetEntry;
  };

  /**
   * Process the given tileset (content) entry that contains B3DM,
   * and return the result.
   *
   * @param sourceEntry - The source entry
   * @returns The processed entry
   */
  private processEntryB3dm = async (
    sourceEntry: TilesetEntry
  ): Promise<TilesetEntry> => {
    const sourceKey = sourceEntry.key;
    const sourceValue = sourceEntry.value;
    let targetKey = sourceKey;
    let targetValue = sourceValue;
    if (this.upgradeOptions.upgradeB3dmToGlb) {
      this.logCallback(`  Upgrading B3DM to GLB for ${sourceKey}`);

      targetKey = this.processContentUri(sourceKey);
      targetValue = await TileFormatsMigration.convertB3dmToGlb(sourceValue);
    } else if (this.upgradeOptions.upgradeB3dmGltf1ToGltf2) {
      this.logCallback(`  Upgrading GLB in ${sourceKey}`);
      targetValue = await ContentUpgrades.upgradeB3dmGltf1ToGltf2(
        sourceValue,
        this.gltfUpgradeOptions
      );
    } else {
      this.logCallback(`  Not upgrading ${sourceKey} (disabled via option)`);
    }
    const targetEntry = {
      key: targetKey,
      value: targetValue,
    };
    return targetEntry;
  };

  /**
   * Process the given tileset (content) entry that contains I3DM,
   * and return the result.
   *
   * @param sourceEntry - The source entry
   * @returns The processed entry
   */
  private processEntryI3dm = async (
    sourceEntry: TilesetEntry
  ): Promise<TilesetEntry> => {
    const sourceKey = sourceEntry.key;
    const sourceValue = sourceEntry.value;
    const targetKey = sourceKey;
    let targetValue = sourceValue;
    if (this.upgradeOptions.upgradeB3dmGltf1ToGltf2) {
      this.logCallback(`  Upgrading GLB in ${sourceKey}`);
      targetValue = await ContentUpgrades.upgradeI3dmGltf1ToGltf2(
        sourceValue,
        this.gltfUpgradeOptions
      );
    } else {
      this.logCallback(`  Not upgrading ${sourceKey} (disabled via option)`);
    }
    const targetEntry = {
      key: targetKey,
      value: targetValue,
    };
    return targetEntry;
  };

  /**
   * Process the given tileset (content) entry that contains the
   * JSON of an external tileset, and return the result.
   *
   * @param sourceEntry - The source entry
   * @returns The processed entry
   */
  private processEntryTileset = async (sourceEntry: TilesetEntry) => {
    const sourceKey = sourceEntry.key;
    const sourceValue = sourceEntry.value;
    const targetKey = sourceKey;
    let targetValue = sourceValue;
    if (this.upgradeOptions.upgradeExternalTilesets) {
      this.logCallback(`  Upgrading external tileset in ${sourceKey}`);
      const externalTileset = JSON.parse(sourceValue.toString()) as Tileset;
      this.upgradeTileset(externalTileset);
      const externalTilesetJsonString = JSON.stringify(
        externalTileset,
        null,
        2
      );
      const externalTilesetJsonBuffer = Buffer.from(externalTilesetJsonString);
      targetValue = externalTilesetJsonBuffer;
    } else {
      this.logCallback(
        `  Not upgrading external tileset in ${sourceKey} (disabled via option)`
      );
    }
    const targetEntry = {
      key: targetKey,
      value: targetValue,
    };
    return targetEntry;
  };
}
