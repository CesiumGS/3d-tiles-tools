import path from "path";

import {
  BoundingSphere,
  Cartesian3,
  OrientedBoundingBox,
  Matrix3,
  Matrix4,
  Rectangle,
} from "cesium";

import { Paths } from "../base/Paths";
import { DeveloperError } from "../base/DeveloperError";

import { Tileset } from "../structure/Tileset";

import { TilesetSource } from "../tilesetData/TilesetSource";
import { TilesetTarget } from "../tilesetData/TilesetTarget";
import { TilesetError } from "../tilesetData/TilesetError";
import { TilesetSources } from "../tilesetData/TilesetSources";
import { TilesetTargets } from "../tilesetData/TilesetTargets";

import { Tilesets } from "../tilesets/Tilesets";

/**
 * A class for merging multiple tilesets, to create a tileset that refers
 * to the merged ones as external tilesets.
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
   * Identifiers for the external tilesets. These will usually
   * be just the last component of the directory name. For example,
   * for a tileset like "./data/example/tileset.json", this will
   * be "example". But the names are disambiguated, just in case...
   */
  private tilesetSourceIdentifiers: string[];

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
    this.tilesetSourceIdentifiers = [];
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
    // Create the sources and target
    for (const tilesetSourceName of tilesetSourceNames) {
      // Determine the name of the file that contains the tileset JSON data
      const tilesetSourceJsonFileName =
        Tilesets.determineTilesetJsonFileName(tilesetSourceName);

      // Determine an "identifier" for the tileset source
      // (see `tilesetSourceIdentifiers` for details)
      let tilesetSourceDirectoryName;
      if (Paths.isDirectory(tilesetSourceName)) {
        tilesetSourceDirectoryName = path.basename(tilesetSourceName);
      } else {
        tilesetSourceDirectoryName = path.basename(
          path.dirname(tilesetSourceName)
        );
      }
      const tilesetSourceIdentifier = TilesetMerger.createIdentifier(
        tilesetSourceDirectoryName,
        this.tilesetSourceIdentifiers
      );

      const tilesetSource = TilesetSources.createAndOpen(tilesetSourceName);
      this.tilesetSources.push(tilesetSource);
      this.tilesetSourceJsonFileNames.push(tilesetSourceJsonFileName);
      this.tilesetSourceIdentifiers.push(tilesetSourceIdentifier);
    }

    this.tilesetTargetJsonFileName =
      Tilesets.determineTilesetJsonFileName(tilesetTargetName);
    this.tilesetTarget = TilesetTargets.createAndBegin(
      tilesetTargetName,
      overwrite
    );

    // Perform the actual merge
    this.mergeInternal();

    // Clean up by closing the sources and the target
    for (const tilesetSource of this.tilesetSources) {
      tilesetSource.close();
    }
    await this.tilesetTarget.end();

    this.tilesetSources.length = 0;
    this.tilesetSourceIdentifiers.length = 0;
    this.tilesetTarget = undefined;
    this.tilesetTargetJsonFileName = undefined;
  }

  /**
   * Internal method for `merge`
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
    const tilesets = [];
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
    const sphere = TilesetMerger.getMergedSphere(tilesets);
    const children = TilesetMerger.getChildren(
      tilesets,
      this.tilesetSourceIdentifiers,
      this.tilesetSourceJsonFileNames
    );
    const mergedTileset = {
      asset: {
        version: "1.1",
      },
      geometricError: geometricError,
      root: {
        boundingVolume: {
          sphere: sphere,
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

    // Copy the resources from the sources to the target
    this.copyResources();
  }

  /**
   * Copy the resources from the source tilesets into the target.
   *
   * This will obtain the entries of all sources, and add them
   * to the target, adding the `tilesetSourceIdentifier` to the
   * path for disambiguation.
   */
  private copyResources(): void {
    if (this.tilesetSources.length == 0 || !this.tilesetTarget) {
      throw new DeveloperError("The sources and target must be defined");
    }

    const length = this.tilesetSources.length;
    for (let i = 0; i < length; ++i) {
      const tilesetSource = this.tilesetSources[i];
      const tilesetSourceIdentifier = this.tilesetSourceIdentifiers[i];
      const sourceKeys = tilesetSource.getKeys();
      for (const sourceKey of sourceKeys) {
        const value = tilesetSource.getValue(sourceKey);
        const targetKey = tilesetSourceIdentifier + "/" + sourceKey;
        if (value) {
          this.tilesetTarget.addEntry(targetKey, value);
        }
      }
    }
  }

  /**
   * Creates an identifier that does not exist yet.
   *
   * If the given prefix is not yet contained in the given list,
   * then it is returned. Otherwise, it is made "unique" in an
   * unspecified way, and then returned.
   *
   * This does NOT add the new identifier to the given list!
   *
   * @param prefix - The prefix
   * @param existingIdentifiers - The existing identifiers
   * @returns The new identifier
   */
  private static createIdentifier(
    prefix: string,
    existingIdentifiers: string[]
  ): string {
    let identifier = prefix;
    let counter = 0;
    for (;;) {
      if (!existingIdentifiers.includes(identifier)) {
        return identifier;
      }
      identifier = prefix + "-" + counter;
      counter++;
    }
  }

  //========================================================================
  // The following functions are ported from the `merge-tilesets` branch
  // at https://github.com/CesiumGS/3d-tiles-tools/blob/d7e76e59022fc5e5aa4b848730ec9f8f4dea6d4e/tools/lib/mergeTilesets.js
  // with slight modification of 'getChildren' for disambiguation...

  private static getChildren(
    tilesets: Tileset[],
    tilesetSourceIdentifiers: string[],
    tilesetJsonFileNames: string[]
  ) {
    const length = tilesets.length;
    const children = new Array(length);
    for (let i = 0; i < length; ++i) {
      const tilesetJsonFileName = tilesetJsonFileNames[i];
      const tilesetSourceIdentifier = tilesetSourceIdentifiers[i];
      const tilesetUrl = Paths.join(
        tilesetSourceIdentifier,
        tilesetJsonFileName
      );

      children[i] = tilesets[i].root;
      children[i].content = {
        uri: tilesetUrl,
      };
      children[i].boundingVolume = {
        sphere: TilesetMerger.getBoundingSphere(tilesets[i]),
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

  private static getBoundingSphere(tileset: Tileset): number[] {
    const root = tileset.root;
    let transform = Matrix4.IDENTITY;
    if (root.transform) {
      transform = Matrix4.fromArray(root.transform);
    }
    const boundingVolume = root.boundingVolume;
    let boundingSphere;
    if (boundingVolume.sphere) {
      boundingSphere = TilesetMerger.createBoundingSphereFromSphere(
        boundingVolume.sphere,
        transform
      );
    } else if (boundingVolume.region) {
      boundingSphere = TilesetMerger.createBoundingSphereFromRegion(
        boundingVolume.region
      );
    } else if (boundingVolume.box) {
      boundingSphere = TilesetMerger.createBoundingSphereFromBox(
        boundingVolume.box,
        transform
      );
    } else {
      throw new TilesetError("No bounding volume found in root tile");
    }
    const center = boundingSphere.center;
    const radius = boundingSphere.radius;
    return [center.x, center.y, center.z, radius];
  }

  private static getMergedSphere(tilesets: Tileset[]): number[] {
    const length = tilesets.length;
    const boundingSpheres = new Array(length);
    for (let i = 0; i < length; ++i) {
      boundingSpheres[i] = BoundingSphere.unpack(
        TilesetMerger.getBoundingSphere(tilesets[i])
      );
    }
    const boundingSphere = BoundingSphere.fromBoundingSpheres(boundingSpheres);
    const center = boundingSphere.center;
    const radius = boundingSphere.radius;
    return [center.x, center.y, center.z, radius];
  }

  private static createBoundingSphereFromBox(
    box: number[],
    transform: Matrix4
  ): BoundingSphere {
    let center = Cartesian3.fromElements(box[0], box[1], box[2]);
    let halfAxes = Matrix3.fromArray(box, 3);

    // Find the transformed center and halfAxes
    center = Matrix4.multiplyByPoint(transform, center, center);
    const rotationScale = Matrix4.getMatrix3(transform, new Matrix3());
    halfAxes = Matrix3.multiply(rotationScale, halfAxes, halfAxes);

    const orientedBoundingBox = new OrientedBoundingBox(center, halfAxes);
    return BoundingSphere.fromOrientedBoundingBox(orientedBoundingBox);
  }

  private static createBoundingSphereFromRegion(
    region: number[]
  ): BoundingSphere {
    const rectangle = Rectangle.unpack(region);
    const minimumHeight = region[4];
    const maximumHeight = region[5];

    const orientedBoundingBox = OrientedBoundingBox.fromRectangle(
      rectangle,
      minimumHeight,
      maximumHeight
    );
    return BoundingSphere.fromOrientedBoundingBox(orientedBoundingBox);
  }

  private static createBoundingSphereFromSphere(
    sphere: number[],
    transform: Matrix4
  ): BoundingSphere {
    let center = Cartesian3.fromElements(sphere[0], sphere[1], sphere[2]);
    let radius = sphere[3];

    // Find the transformed center and radius
    center = Matrix4.multiplyByPoint(transform, center, center);
    const scale = Matrix4.getScale(transform, new Cartesian3());
    const uniformScale = Cartesian3.maximumComponent(scale);
    radius *= uniformScale;

    return new BoundingSphere(center, radius);
  }
}
