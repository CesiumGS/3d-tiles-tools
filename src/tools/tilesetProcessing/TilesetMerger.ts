import path from "path";

import { Paths } from "../../base";
import { DeveloperError } from "../../base";

import { Tileset } from "../../structure";
import { Tile } from "../../structure";

import { TilesetSource } from "../../tilesets";
import { TilesetTarget } from "../../tilesets";
import { TilesetError } from "../../tilesets";
import { TilesetSources } from "../../tilesets";
import { TilesetTargets } from "../../tilesets";
import { Tilesets } from "../../tilesets";

import { BoundingVolumes } from "./BoundingVolumes";

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

      const tilesetSource = TilesetSources.createAndOpen(tilesetSourceName);
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
        const uniqueExternalTilesetDirectory = TilesetMerger.createUnique(
          externalTilesetDirectoryBaseName,
          this.externalTilesetDirectories
        );
        this.externalTilesetDirectories.push(uniqueExternalTilesetDirectory);
      }
    }

    this.tilesetTargetJsonFileName =
      Tilesets.determineTilesetJsonFileName(tilesetTargetName);
    this.tilesetTarget = TilesetTargets.createAndBegin(
      tilesetTargetName,
      overwrite
    );

    // Perform the actual merge, creating the merged tileset JSON
    // in the target
    this.mergeInternal();

    // Copy the resources from the sources to the target
    if (!jsonOnly) {
      this.copyResources();
    }

    // Clean up by closing the sources and the target
    for (const tilesetSource of this.tilesetSources) {
      tilesetSource.close();
    }
    await this.tilesetTarget.end();

    this.tilesetSources.length = 0;
    this.externalTilesetDirectories.length = 0;
    this.tilesetTarget = undefined;
    this.tilesetTargetJsonFileName = undefined;
  }

  /**
   * Internal method for `merge`, only creating the actual merged
   * tileset JSON and putting it into the target.
   */
  private mergeInternal() {
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
      const tilesetJsonBuffer = tilesetSource.getValue(
        tilesetSourceJsonFileName
      );
      if (!tilesetJsonBuffer) {
        const message = `No ${tilesetSourceJsonFileName} found in input`;
        throw new TilesetError(message);
      }
      const tileset = JSON.parse(tilesetJsonBuffer.toString()) as Tileset;
      tilesets.push(tileset);
    }

    // Derive the information for the merged tileset
    const geometricError = TilesetMerger.getMergedGeometricError(tilesets);
    const box = TilesetMerger.getMergedBox(tilesets);
    const children = TilesetMerger.getChildren(
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
    this.tilesetTarget.addEntry(
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
  private copyResources(): void {
    if (this.tilesetSources.length == 0 || !this.tilesetTarget) {
      throw new DeveloperError("The sources and target must be defined");
    }

    const length = this.tilesetSources.length;
    for (let i = 0; i < length; ++i) {
      const tilesetSource = this.tilesetSources[i];
      const externalTilesetDirectory = this.externalTilesetDirectories[i];
      const sourceKeys = tilesetSource.getKeys();
      for (const sourceKey of sourceKeys) {
        const value = tilesetSource.getValue(sourceKey);
        const targetKey = Paths.join(externalTilesetDirectory, sourceKey);
        if (value) {
          this.tilesetTarget.addEntry(targetKey, value);
        }
      }
    }
  }

  /**
   * Creates a string that does not exist yet.
   *
   * If the given prefix is not yet contained in the given list,
   * then it is returned. Otherwise, it is made "unique" in an
   * unspecified way, and then returned.
   *
   * This does NOT add the new string to the given list!
   *
   * @param prefix - The prefix
   * @param existing - The existing strings
   * @returns The unique string
   */
  private static createUnique(prefix: string, existing: string[]): string {
    let result = prefix;
    let counter = 0;
    for (;;) {
      if (!existing.includes(result)) {
        return result;
      }
      result = `${prefix}-${counter}`;
      counter++;
    }
  }

  //========================================================================
  // The following functions are ported from the `merge-tilesets` branch
  // at https://github.com/CesiumGS/3d-tiles-tools/blob/d7e76e59022fc5e5aa4b848730ec9f8f4dea6d4e/tools/lib/mergeTilesets.js
  // with slight modification of 'getChildren' for disambiguation
  // and updates to compute bounding boxes instead of bounding spheres

  private static getChildren(
    tilesets: Tileset[],
    externalTilesetDirectories: string[],
    tilesetJsonFileNames: string[]
  ) {
    const length = tilesets.length;
    const children = Array<Tile>(length);
    for (let i = 0; i < length; ++i) {
      const tilesetJsonFileName = tilesetJsonFileNames[i];
      const externalTilesetDirectory = externalTilesetDirectories[i];
      const tilesetUrl = Paths.join(
        externalTilesetDirectory,
        tilesetJsonFileName
      );

      children[i] = tilesets[i].root;
      children[i].content = {
        uri: tilesetUrl,
      };
      children[i].boundingVolume = {
        box: TilesetMerger.getBoundingBox(tilesets[i]),
      };
      delete children[i].children;
      delete children[i].transform;
    }
    return children;
  }

  private static getMergedGeometricError(tilesets: Tileset[]): number {
    let geometricError = 0.0;
    const length = tilesets.length;
    for (let i = 0; i < length; ++i) {
      geometricError = Math.max(geometricError, tilesets[i].geometricError);
    }
    return geometricError;
  }

  private static getBoundingBox(tileset: Tileset): number[] {
    const root = tileset.root;
    const boundingVolume = root.boundingVolume;
    const boundingVolumeBox =
      BoundingVolumes.computeBoundingVolumeBoxFromBoundingVolume(
        boundingVolume
      );
    if (boundingVolumeBox === undefined) {
      throw new TilesetError("No bounding volume found in root tile");
    }
    if (root.transform === undefined) {
      return boundingVolumeBox;
    }
    return BoundingVolumes.transformBoundingVolumeBox(
      boundingVolumeBox,
      root.transform
    );
  }

  private static getMergedBox(tilesets: Tileset[]): number[] {
    const length = tilesets.length;
    const boundingBoxes = Array<number[]>(length);
    for (let i = 0; i < length; ++i) {
      boundingBoxes[i] = TilesetMerger.getBoundingBox(tilesets[i]);
    }
    const boundingBox =
      BoundingVolumes.computeUnionBoundingVolumeBox(boundingBoxes);
    return boundingBox;
  }
}
