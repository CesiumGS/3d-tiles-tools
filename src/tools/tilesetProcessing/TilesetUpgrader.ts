import { Paths } from "../../base";
import { DeveloperError } from "../../base";

import { ContentDataTypes } from "../../base";

import { Tileset } from "../../structure";
import { Schema } from "../../structure";

import { TilesetEntry } from "../../tilesets";

import { TilesetUpgradeOptions } from "./upgrade/TilesetUpgradeOptions";
import { TilesetObjectUpgrader } from "./upgrade/TilesetObjectUpgrader";

import { ContentUpgrades } from "../contentProcessing/ContentUpgrades";

import { BasicTilesetProcessor } from "./BasicTilesetProcessor";

import { TileFormatsMigration } from "../migration/TileFormatsMigration";

import { Loggers } from "../../base";
const logger = Loggers.get("upgrade");

/**
 * A class for "upgrading" a tileset from a previous version to
 * a more recent version. The details of what that means exactly
 * are not (yet) specified.
 *
 * @internal
 */
export class TilesetUpgrader {
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
   * The tileset processor that will perform the actual upgrade
   */
  private tilesetProcessor: BasicTilesetProcessor | undefined;

  /**
   * Creates a new instance
   *
   * @param targetVersion - The target version - 1.0 or 1.1
   * @param gltfUpgradeOptions - Options that may be passed
   * to `gltf-pipeline` when GLB data in B3DM or I3DM is
   * supposed to be upgraded.
   * @throws DeveloperError If the version is neither 1.0 nor 1.1
   */
  constructor(targetVersion: string, gltfUpgradeOptions: any) {
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
        upgradeEmptyChildrenToUndefined: true,

        upgradeContentGltfExtensionDeclarations: false,

        upgradeB3dmGltf1ToGltf2: true,
        upgradeI3dmGltf1ToGltf2: true,

        upgradePntsToGlb: false,
        upgradeB3dmToGlb: false,
        upgradeI3dmToGlb: false,
        upgradeCmptToGlb: false,
      };
      return options;
    }
    if (version === "1.1") {
      const options: TilesetUpgradeOptions = {
        upgradeExternalTilesets: true,

        upgradedAssetVersionNumber: "1.1",
        upgradeRefineCase: true,
        upgradeContentUrlToUri: true,
        upgradeEmptyChildrenToUndefined: true,

        upgradeContentGltfExtensionDeclarations: true,

        upgradeB3dmGltf1ToGltf2: false,
        upgradeI3dmGltf1ToGltf2: false,

        upgradePntsToGlb: true,
        upgradeB3dmToGlb: true,
        upgradeI3dmToGlb: true,
        upgradeCmptToGlb: true,
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
   * @param overwrite - Whether the target should be overwritten if
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
    const processExternalTilesets = this.upgradeOptions.upgradeExternalTilesets;
    const tilesetProcessor = new BasicTilesetProcessor(processExternalTilesets);
    this.tilesetProcessor = tilesetProcessor;
    await tilesetProcessor.begin(
      tilesetSourceName,
      tilesetTargetName,
      overwrite
    );

    // Perform the upgrade for the actual tileset object
    await tilesetProcessor.forTileset(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (tileset: Tileset, schema: Schema | undefined) => {
        await this.upgradeTileset(tileset);
        return tileset;
      }
    );

    // Perform the updates for the tile contents
    await this.performContentUpgrades(tilesetProcessor);
    await tilesetProcessor.end();
    delete this.tilesetProcessor;
  }

  /**
   * Perform the upgrade of the `Tileset` object, in place.
   *
   * @param tileset - The `Tileset` object
   */
  async upgradeTileset(tileset: Tileset) {
    const tilesetObjectUpgrader = new TilesetObjectUpgrader(
      this.upgradeOptions
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
    }
    if (this.upgradeOptions.upgradeB3dmToGlb) {
      if (Paths.hasExtension(uri, ".b3dm")) {
        return Paths.replaceExtension(uri, ".glb");
      }
    }
    if (this.upgradeOptions.upgradeI3dmToGlb) {
      if (Paths.hasExtension(uri, ".i3dm")) {
        return Paths.replaceExtension(uri, ".glb");
      }
    }
    if (this.upgradeOptions.upgradeCmptToGlb) {
      if (Paths.hasExtension(uri, ".cmpt")) {
        return Paths.replaceExtension(uri, ".glb");
      }
    }
    return uri;
  };

  /**
   * Process the given tileset (content) entry, and return the result.
   *
   * @param sourceEntry - The source entry
   * @param type - The `ContentDataType` of the source entry
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
      logger.error(`Failed to upgrade ${sourceKey}: ${error}`);
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
   * @param type - The `ContentDataType` of the source entry
   * @returns The processed entry
   */
  private processEntryUnchecked = async (
    sourceEntry: TilesetEntry,
    type: string | undefined
  ): Promise<TilesetEntry> => {
    if (type === ContentDataTypes.CONTENT_TYPE_PNTS) {
      return this.processEntryPnts(sourceEntry);
    } else if (type === ContentDataTypes.CONTENT_TYPE_B3DM) {
      return this.processEntryB3dm(sourceEntry);
    } else if (type === ContentDataTypes.CONTENT_TYPE_I3DM) {
      return this.processEntryI3dm(sourceEntry);
    } else if (type === ContentDataTypes.CONTENT_TYPE_CMPT) {
      return this.processEntryCmpt(sourceEntry);
    } else if (type == ContentDataTypes.CONTENT_TYPE_TILESET) {
      return this.processEntryTileset(sourceEntry);
    }
    logger.debug(`  No upgrade operation to perform for ${sourceEntry.key}`);
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
      logger.debug(`  Upgrading PNTS to GLB for ${sourceKey}`);

      targetKey = this.processContentUri(sourceKey);
      targetValue = await TileFormatsMigration.convertPntsToGlb(sourceValue);
    } else {
      logger.debug(`  Not upgrading ${sourceKey} (disabled via option)`);
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
      logger.debug(`  Upgrading B3DM to GLB for ${sourceKey}`);

      targetKey = this.processContentUri(sourceKey);
      targetValue = await TileFormatsMigration.convertB3dmToGlb(sourceValue);
    } else if (this.upgradeOptions.upgradeB3dmGltf1ToGltf2) {
      logger.debug(`  Upgrading GLB in ${sourceKey}`);
      targetValue = await ContentUpgrades.upgradeB3dmGltf1ToGltf2(
        sourceValue,
        this.gltfUpgradeOptions
      );
    } else {
      logger.debug(`  Not upgrading ${sourceKey} (disabled via option)`);
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
    let targetKey = sourceKey;
    let targetValue = sourceValue;
    if (this.upgradeOptions.upgradeI3dmToGlb) {
      logger.debug(`  Upgrading I3DM to GLB for ${sourceKey}`);

      targetKey = this.processContentUri(sourceKey);

      // Define the resolver for external GLB files in I3DM files:
      // It will look up the entry using the 'tilesetProcessor'
      const externalGlbResolver = async (
        uri: string
      ): Promise<Buffer | undefined> => {
        if (!this.tilesetProcessor) {
          return undefined;
        }
        const externalGlbEntry = await this.tilesetProcessor.fetchSourceEntry(
          uri
        );
        if (!externalGlbEntry) {
          return undefined;
        }
        return externalGlbEntry.value;
      };
      targetValue = await TileFormatsMigration.convertI3dmToGlb(
        sourceValue,
        externalGlbResolver
      );
    } else if (this.upgradeOptions.upgradeI3dmGltf1ToGltf2) {
      logger.debug(`  Upgrading GLB in ${sourceKey}`);
      targetValue = await ContentUpgrades.upgradeI3dmGltf1ToGltf2(
        sourceValue,
        this.gltfUpgradeOptions
      );
    } else {
      logger.debug(`  Not upgrading ${sourceKey} (disabled via option)`);
    }
    const targetEntry = {
      key: targetKey,
      value: targetValue,
    };
    return targetEntry;
  };

  /**
   * Process the given tileset (content) entry that contains CMPT,
   * and return the result.
   *
   * @param sourceEntry - The source entry
   * @returns The processed entry
   */
  private processEntryCmpt = async (
    sourceEntry: TilesetEntry
  ): Promise<TilesetEntry> => {
    const sourceKey = sourceEntry.key;
    const sourceValue = sourceEntry.value;
    let targetKey = sourceKey;
    let targetValue = sourceValue;
    if (this.upgradeOptions.upgradeCmptToGlb) {
      logger.debug(`  Upgrading CMPT to GLB for ${sourceKey}`);

      targetKey = this.processContentUri(sourceKey);

      // Define the resolver for resources like external GLB files
      // in CMPT files: It will look up the entry using the
      // 'tilesetProcessor'
      const externalResourceResolver = async (
        uri: string
      ): Promise<Buffer | undefined> => {
        if (!this.tilesetProcessor) {
          return undefined;
        }
        const externalGlbEntry = await this.tilesetProcessor.fetchSourceEntry(
          uri
        );
        if (!externalGlbEntry) {
          return undefined;
        }
        return externalGlbEntry.value;
      };
      targetValue = await TileFormatsMigration.convertCmptToGlb(
        sourceValue,
        externalResourceResolver
      );
    } else {
      logger.debug(`  Not upgrading ${sourceKey} (disabled via option)`);
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
      logger.debug(`  Upgrading external tileset in ${sourceKey}`);
      const externalTileset = JSON.parse(sourceValue.toString()) as Tileset;
      await this.upgradeTileset(externalTileset);
      const externalTilesetJsonString = JSON.stringify(
        externalTileset,
        null,
        2
      );
      const externalTilesetJsonBuffer = Buffer.from(externalTilesetJsonString);
      targetValue = externalTilesetJsonBuffer;
    } else {
      logger.debug(
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
