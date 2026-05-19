import path from "path";

import { Paths } from "../../base";
import { DeveloperError } from "../../base";

import { Tileset } from "../../structure";

import { TilesetSource } from "../../tilesets";
import { TilesetTarget } from "../../tilesets";
import { TilesetSources } from "../../tilesets";
import { TilesetTargets } from "../../tilesets";
import { Tilesets } from "../../tilesets";

import { TilesetMergers } from "./TilesetMergers";

/**
 * A class for merging multiple tilesets, to create a tileset that refers
 * to the merged ones as external tilesets.
 *
 * @internal
 */
export class TilesetMerger {
  /**
   * The tileset sources that have been created from the source names
   */
  private tilesetSources: TilesetSource[];

  /**
   * The file names for the tileset JSON files.
   *
   * If the inputs are tileset JSON files, then these are the file names.
   * If the inputs are directories or files that do not end with ".json",
   * then these names will default to "tileset.json"
   */
  private tilesetSourceJsonFileNames: string[];

  /**
   * The directories that will contain the external tilesets.
   *
   * For the default `merge` operation, these will be the last component
   * of the source directory name. For example, for a tileset like
   * "./data/example/tileset.json", this will be "example".
   * The merger will create subdirectories in the target directory,
   * and copy the source tilesets into these directories. The merged
   * tileset will then refer to these (copied) tilesets. Duplicate
   * names will be disambiguated.
   *
   * For the `mergeJson` operation, these will be relative paths,
   * pointing from the target directory to the original source
   * directories.
   *
   * In both cases, these will be the directories that appear in
   * the `content.uri` of the merged tileset.
   */
  private externalTilesetDirectories: string[];

  /**
   * The target that the resulting tileset will be written to.
   */
  private tilesetTarget: TilesetTarget | undefined;

  /**
   * The name of the tileset JSON file in the target.
   * (Usually `tileset.json`)
   */
  private tilesetTargetJsonFileName: string | undefined;

  /**
   * Creates a new instance
   */
  constructor() {
    this.tilesetSources = [];
    this.tilesetSourceJsonFileNames = [];
    this.externalTilesetDirectories = [];
  }

  /**
   * Merges the tileset from the specified sources into one tileset
   * that refers to the sources as external ones, and writes the
   * result into the given target.
   *
   * @param tilesetSourceNames - The tileset source names
   * @param tilesetTargetName - The tileset target name
   * @param overwrite - Whether target files should be overwritten
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed
   * @throws TilesetError When the output already exists
   * and `overwrite` was `false`.
   */
  async merge(
    tilesetSourceNames: string[],
    tilesetTargetName: string,
    overwrite: boolean
  ): Promise<void> {
    return this.mergeOperation(
      tilesetSourceNames,
      tilesetTargetName,
      overwrite,
      false
    );
  }

  /**
   * Merges the tileset from the specified sources into one tileset
   * that refers to the sources as external ones, and writes the
   * result into the given target without copying resources to
   * output directory.
   *
   * @param tilesetSourceNames - The tileset source names
   * @param tilesetTargetName - The tileset target name
   * @param overwrite - Whether target files should be overwritten
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed
   * @throws TilesetError When the output already exists
   * and `overwrite` was `false`.
   */
  async mergeJson(
    tilesetSourceNames: string[],
    tilesetTargetName: string,
    overwrite: boolean
  ): Promise<void> {
    return this.mergeOperation(
      tilesetSourceNames,
      tilesetTargetName,
      overwrite,
      true
    );
  }

  /**
   * Internal method to differentiate between `merge` and `mergeJson`
   *
   * @param tilesetSourceNames - The tileset source names
   * @param tilesetTargetName - The tileset target name
   * @param overwrite - Whether target files should be overwritten
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed
   */
  private async mergeOperation(
    tilesetSourceNames: string[],
    tilesetTargetName: string,
    overwrite: boolean,
    jsonOnly: boolean
  ): Promise<void> {
    const tilesetTargetDirectory =
      Tilesets.determineTilesetDirectoryName(tilesetTargetName);

    for (const tilesetSourceName of tilesetSourceNames) {
      // Determine the name of the file that contains the tileset JSON data,
      // and the source directory
      const tilesetSourceJsonFileName =
        Tilesets.determineTilesetJsonFileName(tilesetSourceName);
      const externalTilesetDirectory =
        Tilesets.determineTilesetDirectoryName(tilesetSourceName);

      const tilesetSource = await TilesetSources.createAndOpen(
        tilesetSourceName
      );
      this.tilesetSources.push(tilesetSource);
      this.tilesetSourceJsonFileNames.push(tilesetSourceJsonFileName);

      // Determine the directory name that will be used for referring
      // to the source tileset (via the `content.uri` in the merged
      // tileset), and store it in the 'externalTilesetDirectories'.
      if (jsonOnly) {
        // When only a merged JSON should be created, then the
        // external tileset directory will be a relative path,
        // pointing from the original source to the target
        const relativeExternalTilesetDirectory = Paths.relativize(
          tilesetTargetDirectory,
          externalTilesetDirectory
        );

        this.externalTilesetDirectories.push(relativeExternalTilesetDirectory);
      } else {
        // When a full merge operation is performed, then the
        // source tilesets are copied into the target directory,
        // using a name that just consists of the base name (last
        // path component) of the source directory, disambiguated
        const externalTilesetDirectoryBaseName = path.basename(
          externalTilesetDirectory
        );
        const uniqueExternalTilesetDirectory = TilesetMergers.createUnique(
          externalTilesetDirectoryBaseName,
          this.externalTilesetDirectories
        );
        this.externalTilesetDirectories.push(uniqueExternalTilesetDirectory);
      }
    }

    this.tilesetTargetJsonFileName =
      Tilesets.determineTilesetJsonFileName(tilesetTargetName);
    this.tilesetTarget = await TilesetTargets.createAndBegin(
      tilesetTargetName,
      overwrite
    );

    // Perform the actual merge, creating the merged tileset JSON
    // in the target
    await this.mergeInternal();

    // Copy the resources from the sources to the target
    if (!jsonOnly) {
      await this.copyResources();
    }

    // Clean up by closing the sources and the target
    for (const tilesetSource of this.tilesetSources) {
      await tilesetSource.close();
    }
    await this.tilesetTarget.end();

    this.tilesetSources.length = 0;
    this.tilesetSourceJsonFileNames.length = 0;
    this.externalTilesetDirectories.length = 0;
    this.tilesetTarget = undefined;
    this.tilesetTargetJsonFileName = undefined;
  }

  /**
   * Internal method for `merge`, only creating the actual merged
   * tileset JSON and putting it into the target.
   */
  private async mergeInternal() {
    if (
      this.tilesetSources.length == 0 ||
      !this.tilesetTarget ||
      !this.tilesetTargetJsonFileName
    ) {
      throw new DeveloperError("The sources and target must be defined");
    }

    // Parse the Tileset objects from all sources
    const tilesets: Tileset[] = [];
    const length = this.tilesetSources.length;
    for (let i = 0; i < length; ++i) {
      const tilesetSource = this.tilesetSources[i];
      const tilesetSourceJsonFileName = this.tilesetSourceJsonFileNames[i];
      const tileset = await TilesetSources.parseSourceValue<Tileset>(
        tilesetSource,
        tilesetSourceJsonFileName
      );
      tilesets.push(tileset);
    }

    // Derive the information for the merged tileset
    const geometricError = TilesetMergers.getMergedGeometricError(tilesets);
    const box = TilesetMergers.getMergedBox(tilesets);
    const children = TilesetMergers.getChildren(
      tilesets,
      this.externalTilesetDirectories,
      this.tilesetSourceJsonFileNames
    );
    const mergedTileset = {
      asset: {
        version: "1.1",
      },
      geometricError: geometricError,
      root: {
        boundingVolume: {
          box: box,
        },
        refine: "ADD",
        geometricError: geometricError,
        children: children,
      },
    };

    // Write the merged tileset into the target
    const mergedTilesetJson = JSON.stringify(mergedTileset, null, 2);
    const mergedTilesetBuffer = Buffer.from(mergedTilesetJson);
    await this.tilesetTarget.addEntry(
      this.tilesetTargetJsonFileName,
      mergedTilesetBuffer
    );
  }

  /**
   * Copy the resources from the source tilesets into the target.
   *
   * This will obtain the entries of all sources, and add them
   * to the target, adding the `externalTilesetDirectory` to the
   * path.
   */
  private async copyResources(): Promise<void> {
    if (this.tilesetSources.length == 0 || !this.tilesetTarget) {
      throw new DeveloperError("The sources and target must be defined");
    }

    const length = this.tilesetSources.length;
    for (let i = 0; i < length; ++i) {
      const tilesetSource = this.tilesetSources[i];
      const externalTilesetDirectory = this.externalTilesetDirectories[i];
      const sourceKeys = await tilesetSource.getKeys();
      for await (const sourceKey of sourceKeys) {
        const value = await tilesetSource.getValue(sourceKey);
        const targetKey = Paths.join(externalTilesetDirectory, sourceKey);
        if (value) {
          await this.tilesetTarget.addEntry(targetKey, value);
        }
      }
    }
  }
}
