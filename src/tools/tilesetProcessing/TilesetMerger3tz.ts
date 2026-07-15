import path from "path";

import { Paths } from "../../base";
import { DeveloperError } from "../../base";

import { Tileset } from "../../structure";
import { Tile } from "../../structure";

import { TilesetSource } from "../../tilesets";
import { TilesetTarget } from "../../tilesets";
import { TilesetSources } from "../../tilesets";
import { TilesetTargets } from "../../tilesets";
import { TilesetError } from "../../tilesets";
import { Tilesets } from "../../tilesets";

import { TilesetMergers } from "./TilesetMergers";

/**
 * A class for merging multiple 3TZ files.
 *
 * This class expects a collection of 3TZ files as the input,
 * and creates a tileset JSON file that points to these 3TZ
 * files as their tile content, using the `MAXAR_content_3tz`
 * extension.
 *
 * @internal
 */
export class TilesetMerger3tz {
  /**
   * The tileset sources that have been created from the source names
   */
  private tilesetSources: TilesetSource[];

  /**
   * The file names of the input files.
   *
   * These will the names of the 3TZ files, without their directory name
   */
  private tilesetSourceFileNames: string[];

  /**
   * The directories that contain the input tilesets.
   *
   * These will be relative paths, pointing from the target directory
   * to the original source directories. These will be the directories
   * that appear in the `content.uri` of the merged tileset.
   */
  private tilesetSourceDirectories: string[];

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
    this.tilesetSourceFileNames = [];
    this.tilesetSourceDirectories = [];
  }

  /**
   * Merges the tileset from the specified sources into one tileset
   * that refers to the sources as tile content ones, and writes the
   * result int JSON file into the given target.
   *
   * This expects all tileset sources to be 3TZ files.
   *
   * @param tilesetSourceNames - The tileset source names
   * @param tilesetTargetName - The tileset target name
   * @param overwrite - Whether target files should be overwritten
   * @returns A promise that resolves when the process is finished
   * @throws TilesetError When the input could not be processed
   * @throws TilesetError When the output already exists
   * and `overwrite` was `false`.
   */
  async mergeJson3tz(
    tilesetSourceNames: string[],
    tilesetTargetName: string,
    overwrite: boolean
  ): Promise<void> {
    const tilesetTargetDirectory =
      Tilesets.determineTilesetDirectoryName(tilesetTargetName);

    for (const tilesetSourceName of tilesetSourceNames) {
      // Determine the name of the file that contains the tileset,
      // and the source directory, as a path that is relative to
      // the target
      const tilesetSourceFileName = path.basename(tilesetSourceName);
      if (!Paths.hasExtension(tilesetSourceFileName, ".3tz")) {
        throw new TilesetError(
          "The tileset source file names must have the " +
            "extension '.3tz', but found " +
            tilesetSourceFileName
        );
      }
      const tilesetSourceDirectory =
        Tilesets.determineTilesetDirectoryName(tilesetSourceName);
      const tilesetSource = await TilesetSources.createAndOpen(
        tilesetSourceName
      );
      this.tilesetSources.push(tilesetSource);
      this.tilesetSourceFileNames.push(tilesetSourceFileName);

      const relativeTilesetSourceDirectory = Paths.relativize(
        tilesetTargetDirectory,
        tilesetSourceDirectory
      );
      this.tilesetSourceDirectories.push(relativeTilesetSourceDirectory);
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

    // Clean up by closing the sources and the target
    for (const tilesetSource of this.tilesetSources) {
      await tilesetSource.close();
    }
    await this.tilesetTarget.end();

    this.tilesetSources.length = 0;
    this.tilesetSourceDirectories.length = 0;
    this.tilesetSourceFileNames.length = 0;
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
      // The tileset file name in 3TZ is fixed to be 'tileset.json'
      const tilesetSourceJsonFileName = "tileset.json";
      const tileset = await TilesetSources.parseSourceValue<Tileset>(
        tilesetSource,
        tilesetSourceJsonFileName
      );
      tilesets.push(tileset);
    }

    // Derive the information for the merged tileset
    const geometricError = TilesetMergers.getMergedGeometricError(tilesets);
    const box = TilesetMergers.getMergedBox(tilesets);
    const children = TilesetMerger3tz.getChildren3tz(
      tilesets,
      this.tilesetSourceDirectories,
      this.tilesetSourceFileNames
    );

    // Create the merged tileset, including the MAXAR_content_3tz
    // extension usage declaration
    const mergedTileset = {
      asset: {
        version: "1.1",
      },
      extensionsUsed: ["MAXAR_content_3tz"],
      extensionsRequired: ["MAXAR_content_3tz"],
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
   * Creates the child tiles for the root node of a tileset that combines
   * multiple 3TZ tilesets.
   *
   * The children will be created from the root tiles of the given tilesets.
   * Their content URI will point to `directory/fileName`, based on the
   * given directory- and file names.
   *
   * Their bounding volume will be a bounding box that is created from
   * the bounding volume of the root.
   *
   * Their children, transform, and implicit tiling will be deleted.
   *
   * @param tilesets - The input tilesets
   * @param tilesetSourceDirectories - The directory names of the inputs
   * @param tilesetSourceFileNames - The file names of the inputs
   * @returns The children
   */
  static getChildren3tz(
    tilesets: Tileset[],
    tilesetSourceDirectories: string[],
    tilesetSourceFileNames: string[]
  ) {
    const length = tilesets.length;
    const children = Array<Tile>(length);
    for (let i = 0; i < length; ++i) {
      const tilesetSourceFileName = tilesetSourceFileNames[i];
      const tilesetSourceDirectory = tilesetSourceDirectories[i];
      const tilesetUrl = Paths.join(
        tilesetSourceDirectory,
        tilesetSourceFileName
      );

      children[i] = tilesets[i].root;
      children[i].content = {
        uri: tilesetUrl,
      };
      children[i].boundingVolume = {
        box: TilesetMergers.getBoundingBox(tilesets[i]),
      };
      delete children[i].children;
      delete children[i].transform;
      delete children[i].implicitTiling;
    }
    return children;
  }
}
