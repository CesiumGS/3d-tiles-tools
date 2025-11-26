import { Schema, Tileset } from "../../structure";
import { BasicTilesetProcessor } from "./BasicTilesetProcessor";
import { ContentDataTypes, Loggers } from "../../base";
import {
  Extensions,
  TilesetEntry,
  Tilesets,
  TilesetSource,
  TilesetSources,
  TilesetTarget,
  TilesetTargets,
} from "../../tilesets";
import { GltfUtilities } from "../contentProcessing/GltfUtilities";

const logger = Loggers.get("splatUpgrade");

const OLD_SPLAT_EXTENSION = "KHR_spz_gaussian_splats_compression";
const NEW_SPLAT_EXTENSION = "KHR_gaussian_splatting";
const NEW_SPZ_EXTENSION = "KHR_gaussian_splatting_compression_spz_2";

export class TilesetSplatUpgrader {
  /**
   * The tileset processor that will perform the actual upgrade
   */
  private tilesetProcessor: BasicTilesetProcessor | undefined;

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
    const tilesetSourceJsonFileName =
      Tilesets.determineTilesetJsonFileName(tilesetSourceName);
    const tilesetTargetJsonFileName =
      Tilesets.determineTilesetJsonFileName(tilesetTargetName);
    const tilesetSource = await TilesetSources.createAndOpen(tilesetSourceName);
    const tilesetTarget = await TilesetTargets.createAndBegin(
      tilesetTargetName,
      overwrite
    );

    await this.upgradeData(
      tilesetSource,
      tilesetSourceJsonFileName,
      tilesetTarget,
      tilesetTargetJsonFileName
    );

    await tilesetSource.close();
    await tilesetTarget.end();
  }

  /**
   * Upgrade the specified source tileset, and write it to the given
   * target.
   *
   * The caller is responsible for calling `open` on the given
   * source and `begin` on the given target before calling this
   * method, and `close` on the source and `end` on the target
   * after calling this method.
   *
   * @param tilesetSource - The tileset source
   * @param tilesetSourceJsonFileName - The name of the top-level
   * tileset JSON file in the source
   * @param tilesetTarget - The tileset target
   * @param tilesetTargetJsonFileName - The name of the top-level
   * tileset JSON file in the target
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed,
   * or when the output already exists and `overwrite` was `false`.
   */
  async upgradeData(
    tilesetSource: TilesetSource,
    tilesetSourceJsonFileName: string,
    tilesetTarget: TilesetTarget,
    tilesetTargetJsonFileName: string
  ): Promise<void> {
    this.tilesetProcessor = new BasicTilesetProcessor(true);
    await this.tilesetProcessor.beginData(
      tilesetSource,
      tilesetSourceJsonFileName,
      tilesetTarget,
      tilesetTargetJsonFileName
    );

    // Perform the upgrade for the actual tileset object
    await this.tilesetProcessor.forTileset(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (tileset: Tileset, schema: Schema | undefined) => {
        await this.upgradeTileset(tileset);
        return tileset;
      }
    );

    // Perform the updates for the tile contents
    await this.performContentUpgrades(this.tilesetProcessor);
    await this.tilesetProcessor.end(false);
  }

  /**
   * Perform the upgrade of the `Tileset` object, in place.
   *
   * @param tileset - The `Tileset` object
   */
  async upgradeTileset(tileset: Tileset) {
    const upgradeRequired = await this.verifyUpgradeRequired(tileset);
    if (upgradeRequired) {
      logger.debug(`Upgrading tileset.json`);

      if (typeof tileset.extensions === "undefined") {
        logger.error(
          "Extensions property missing on tileset. Are you sure this is a 3DGS tileset? Unable to continue."
        );

        return;
      }

      // Update 3DTILES_content_gltf with correct extensions.
      const upgradedList = [NEW_SPLAT_EXTENSION, NEW_SPZ_EXTENSION];
      const extensionsRequired =
        tileset.extensions["3DTILES_content_gltf"]["extensionsRequired"];
      extensionsRequired.splice(0, extensionsRequired.length, ...upgradedList);
      const extensionsUsed =
        tileset.extensions["3DTILES_content_gltf"]["extensionsUsed"];
      extensionsUsed.splice(0, extensionsUsed.length, ...upgradedList);
    }
  }

  private async performContentUpgrades(
    tilesetProcessor: BasicTilesetProcessor
  ): Promise<void> {
    await tilesetProcessor.processTileContentEntries(
      this.processContentUri,
      this.processEntry
    );
  }

  /**
   * Process the given content URI. Effectively a no-op, and just returns the
   * URI unchanged.
   *
   * @param uri - The URI
   * @returns The processed URI.
   * @private
   */
  private processContentUri(uri: string): string {
    // We don't actually need this, but it's required for
    // `processTileContentEntries` so we treat it as a no-op.

    return uri;
  }

  private async processEntry(
    sourceEntry: TilesetEntry,
    type: string | undefined
  ): Promise<TilesetEntry> {
    try {
      return await this.processEntryUnchecked(sourceEntry, type);
    } catch (error) {
      logger.error(`Failed to upgrade ${sourceEntry.key}: ${error}`);
      return sourceEntry;
    }
  }

  private async processEntryUnchecked(
    sourceEntry: TilesetEntry,
    type: string | undefined
  ): Promise<TilesetEntry> {
    if (type === ContentDataTypes.CONTENT_TYPE_GLB) {
      return this.processEntryGlb(sourceEntry);
    } else if (type === ContentDataTypes.CONTENT_TYPE_GLTF) {
      return this.processEntryGltf(sourceEntry);
    }
    logger.debug(`  No upgrade operation to perform for ${sourceEntry.key}`);
    return sourceEntry;
  }

  private async processEntryGlb(sourceEntry: TilesetEntry): Promise<TilesetEntry> {
    const sourceKey = sourceEntry.key;
    const sourceValue = sourceEntry.value;
    const targetKey = sourceKey;
    logger.debug(`  Upgrading GLB for ${sourceKey}`);
    const targetValue =
      GltfUtilities.replaceLegacyGaussianSplattingExtensionGlb(sourceValue);

    return {
      key: targetKey,
      value: targetValue,
    };
  }

  private async processEntryGltf(sourceEntry: TilesetEntry): Promise<TilesetEntry> {
    const sourceKey = sourceEntry.key;
    const sourceValue = sourceEntry.value;
    const targetKey = sourceKey;
    logger.debug(`  Upgrading glTF for ${sourceKey}`);
    const targetValue =
      GltfUtilities.replaceLegacyGaussianSplattingExtensionGltf2Json(sourceValue);

    return {
      key: targetKey,
      value: targetValue,
    };
  }

  /**
   * Checks the content of the 3DTILES_content_gltf extension on the tileset
   * and returns true if it contains the old 3DGS extension.
   *
   * @param tileset - The parsed tileset
   * @private
   */
  private async verifyUpgradeRequired(tileset: Tileset): Promise<boolean> {
    if (!Extensions.containsExtension(tileset, "3DTILES_content_gltf")) {
      logger.error(
        "3DTILES_content_gltf extension not found. Are you sure this is a 3DGS tileset? Unable to continue."
      );
      return false;
    }

    if (typeof tileset.extensions === "undefined") {
      logger.error(
        "Extensions property missing on tileset. Are you sure this is a 3DGS tileset? Unable to continue."
      );

      return false;
    }

    const extensionsRequired = tileset.extensions["3DTILES_content_gltf"][
      "extensionsRequired"
    ] as string[];
    const extensionsUsed = tileset.extensions["3DTILES_content_gltf"][
      "extensionsUsed"
    ] as string[];

    return (
      extensionsRequired.includes(OLD_SPLAT_EXTENSION) ||
      extensionsUsed.includes(OLD_SPLAT_EXTENSION)
    );
  }
}
