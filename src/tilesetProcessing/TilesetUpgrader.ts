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

export class TilesetUpgrader {
  /**
   * A function that will receive log messages during the upgrade process
   */
  private readonly logCallback: (message: any) => void;

  /**
   * Creates a new instance
   */
  constructor() {
    this.logCallback = (message: any) => console.log(message);
  }

  async upgrade(
    tilesetSourceName: string,
    tilesetTargetName: string
  ): Promise<void> {
    // TODO This does not copy resources yet - should it do that?

    const overwrite = true;
    const tilesetSource = TilesetSources.createAndOpen(tilesetSourceName);
    const tilesetTarget = TilesetTargets.createAndBegin(
      tilesetTargetName,
      overwrite
    );

    const tilesetSourceJsonFileName =
      Tilesets.determineTilesetJsonFileName(tilesetSourceName);

    const tilesetTargetJsonFileName =
      Tilesets.determineTilesetJsonFileName(tilesetTargetName);

    await this.upgradeInternal(
      tilesetSource,
      tilesetSourceJsonFileName,
      tilesetTarget,
      tilesetTargetJsonFileName
    );

    tilesetSource.close();
    await tilesetTarget.end();
  }

  private async upgradeInternal(
    tilesetSource: TilesetSource,
    tilesetSourceJsonFileName: string,
    tilesetTarget: TilesetTarget,
    tilesetTargetJsonFileName: string
  ): Promise<void> {
    const tilesetJsonBuffer = tilesetSource.getValue(tilesetSourceJsonFileName);
    if (!tilesetJsonBuffer) {
      const message = `No ${tilesetSourceJsonFileName} found in input`;
      throw new TilesetError(message);
    }
    const tileset = JSON.parse(tilesetJsonBuffer.toString()) as Tileset;

    await this.upgradeTileset(tileset);

    const resultTilesetJsonString = JSON.stringify(tileset, null, 2);
    const resultTilesetJsonBuffer = Buffer.from(resultTilesetJsonString);
    tilesetTarget.addEntry(tilesetTargetJsonFileName, resultTilesetJsonBuffer);
  }

  async upgradeTileset(tileset: Tileset): Promise<void> {
    TilesetUpgrader.upgradeContentUrlToUri(tileset, this.logCallback);
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
}
