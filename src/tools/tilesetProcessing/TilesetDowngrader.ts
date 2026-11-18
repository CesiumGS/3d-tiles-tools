import { BoundingVolume } from "../../structure";
import { Content } from "../../structure";
import { Extensions } from "../../tilesets";
import { MetadataEntity } from "../../structure";
import { Tile } from "../../structure";
import { Tiles } from "../../tilesets";
import { Tileset } from "../../structure";

import { BoundingVolumeRefiner } from "./BoundingVolumeRefiner";

/**
 * The names of 3D Tiles extensions that became core features in
 * 3D Tiles 1.1, or that are otherwise meaningless after the
 * conversion to an explicit 1.0 tileset.
 */
const EXTENSIONS_REMOVED_FOR_1_0 = [
  "3DTILES_implicit_tiling",
  "3DTILES_metadata",
  "3DTILES_content_gltf",
  "3DTILES_multiple_contents",
  "3DTILES_bounding_volume_S2",
];

const EXTENSIONS_REMOVED_FOR_1_1 = [
  "3DTILES_implicit_tiling",
  "3DTILES_bounding_volume_S2",
];

/**
 * Metadata semantics that override tile or content bounding volumes
 */
const BOUNDING_VOLUME_SEMANTICS = new Set<string>([
  "TILE_BOUNDING_BOX",
  "TILE_BOUNDING_REGION",
  "TILE_BOUNDING_SPHERE",
  "TILE_MINIMUM_HEIGHT",
  "TILE_MAXIMUM_HEIGHT",
  "CONTENT_BOUNDING_BOX",
  "CONTENT_BOUNDING_REGION",
  "CONTENT_BOUNDING_SPHERE",
  "CONTENT_MINIMUM_HEIGHT",
  "CONTENT_MAXIMUM_HEIGHT",
]);

/**
 * Error thrown when a tileset contains a feature that has no
 * representation in the target version.
 */
export class DowngradeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DowngradeError";
  }
}

/**
 * Methods to turn an explicit 3D Tiles 1.1 tileset into a
 * 3D Tiles 1.0 tileset, or to clean up an explicit 1.1 tileset
 * after implicit tiling has been removed.
 *
 * All methods modify the given tileset in place. Callers that
 * need multiple output versions should pass deep copies.
 */
export class TilesetDowngrader {
  /**
   * Converts the given explicit tileset into a 3D Tiles 1.0 tileset.
   *
   * - `asset.version` becomes `"1.0"`
   * - Metadata (`schema`, `schemaUri`, `statistics`, `groups`,
   *   `metadata` on the tileset, tiles, and contents) is removed
   * - Single-element `contents` arrays become `content`
   * - Content URIs are mapped with the given function (used to
   *   rename `.glb` to `.b3dm`)
   * - Extensions that are 1.1 core features are removed from
   *   `extensionsUsed` and `extensionsRequired`
   *
   * @param tileset - The tileset
   * @param contentUriMapper - Maps each content URI to the URI that
   * the content will have in the output
   * @throws DowngradeError if a tile has multiple contents
   */
  static downgradeTo10(
    tileset: Tileset,
    contentUriMapper: (uri: string) => string
  ): void {
    tileset.asset.version = "1.0";
    delete tileset.schema;
    delete tileset.schemaUri;
    delete tileset.statistics;
    delete tileset.groups;
    delete tileset.metadata;

    if (!tileset.root.refine) {
      // Required for the root tile in 3D Tiles 1.0
      tileset.root.refine = "REPLACE";
    }

    TilesetDowngrader.forEachTile(tileset.root, (tile: Tile, path: string) => {
      delete tile.metadata;
      delete tile.implicitTiling;
      TilesetDowngrader.convertS2ToRegion(tile.boundingVolume);
      if (tile.viewerRequestVolume) {
        TilesetDowngrader.convertS2ToRegion(tile.viewerRequestVolume);
      }
      const contents = Tiles.getContents(tile);
      if (contents.length > 1) {
        throw new DowngradeError(
          `Tile ${path} has ${contents.length} contents. 3D Tiles 1.0 ` +
            `supports a single content per tile. Use --targetVersion 1.1 ` +
            `for this tileset.`
        );
      }
      for (const content of contents) {
        delete content.metadata;
        delete content.group;
        if (content.boundingVolume) {
          TilesetDowngrader.convertS2ToRegion(content.boundingVolume);
        }
        content.uri = contentUriMapper(content.uri);
      }
      if (contents.length === 1) {
        tile.content = contents[0];
        delete tile.contents;
      } else {
        delete tile.content;
        delete tile.contents;
      }
    });

    TilesetDowngrader.removeExtensionDeclarations(
      tileset,
      EXTENSIONS_REMOVED_FOR_1_0
    );
    TilesetDowngrader.deleteEmptyExtensionArrays(tileset);
  }

  /**
   * Cleans up an explicit 3D Tiles 1.1 tileset after implicit tiling
   * was removed: `implicitTiling` remnants and the legacy extension
   * declarations are dropped. Multiple contents are allowed.
   *
   * @param tileset - The tileset
   */
  static finalize11(tileset: Tileset): void {
    tileset.asset.version = "1.1";
    let hasMetadataEntities =
      tileset.metadata !== undefined ||
      (tileset.groups !== undefined && tileset.groups.length > 0);
    TilesetDowngrader.forEachTile(tileset.root, (tile: Tile) => {
      delete tile.implicitTiling;
      const contents = Tiles.getContents(tile);
      if (tile.metadata) {
        hasMetadataEntities = true;
      }
      for (const content of contents) {
        if (content.metadata) {
          hasMetadataEntities = true;
        }
      }
      if (contents.length === 1 && tile.contents) {
        tile.content = contents[0];
        delete tile.contents;
      }
    });
    // Subtree metadata is not carried over, so a schema that no
    // remaining entity refers to only adds a validation surface
    // (tiler-generated schema ids are not always valid)
    if (!hasMetadataEntities) {
      delete tileset.schema;
      delete tileset.schemaUri;
      delete tileset.statistics;
    }
    TilesetDowngrader.removeExtensionDeclarations(
      tileset,
      EXTENSIONS_REMOVED_FOR_1_1
    );
    TilesetDowngrader.deleteEmptyExtensionArrays(tileset);
  }

  /**
   * Removes metadata properties whose semantics describe bounding
   * volumes (`TILE_BOUNDING_BOX`, `TILE_MINIMUM_HEIGHT`, ...) from all
   * tiles and contents. After the bounding volumes were refined, these
   * values are stale and clients that honor the semantics would
   * override the refined volumes with them.
   *
   * Metadata entities that end up without properties are removed.
   *
   * @param tileset - The tileset
   * @returns The number of properties that were removed
   */
  static removeBoundingVolumeSemantics(tileset: Tileset): number {
    const schema = tileset.schema;
    if (!schema?.classes) {
      return 0;
    }
    const semanticProperties = new Map<string, string[]>();
    for (const [className, metadataClass] of Object.entries(schema.classes)) {
      const names: string[] = [];
      for (const [propertyName, property] of Object.entries(
        metadataClass.properties ?? {}
      )) {
        if (
          property.semantic !== undefined &&
          BOUNDING_VOLUME_SEMANTICS.has(property.semantic)
        ) {
          names.push(propertyName);
        }
      }
      if (names.length > 0) {
        semanticProperties.set(className, names);
      }
    }
    if (semanticProperties.size === 0) {
      return 0;
    }
    let removed = 0;
    const strip = (owner: { metadata?: MetadataEntity }) => {
      const entity = owner.metadata;
      if (!entity?.properties) {
        return;
      }
      for (const name of semanticProperties.get(entity.class) ?? []) {
        if (name in entity.properties) {
          delete entity.properties[name];
          removed++;
        }
      }
      if (Object.keys(entity.properties).length === 0) {
        delete owner.metadata;
      }
    };
    TilesetDowngrader.forEachTile(tileset.root, (tile: Tile) => {
      strip(tile);
      for (const content of Tiles.getContents(tile)) {
        strip(content);
      }
    });
    return removed;
  }

  /**
   * Returns all content URIs of all tiles in the given tileset
   */
  static collectContentUris(tileset: Tileset): string[] {
    const uris: string[] = [];
    TilesetDowngrader.forEachTile(tileset.root, (tile: Tile) => {
      const contents: Content[] = Tiles.getContents(tile);
      for (const content of contents) {
        uris.push(content.uri);
      }
    });
    return uris;
  }

  /**
   * Replaces a `3DTILES_bounding_volume_S2` extension object in the
   * given bounding volume with an equivalent `region`, in place
   */
  private static convertS2ToRegion(boundingVolume: BoundingVolume): void {
    const s2 = boundingVolume.extensions?.["3DTILES_bounding_volume_S2"];
    if (!s2) {
      return;
    }
    boundingVolume.region = BoundingVolumeRefiner.s2ToRegion(
      s2 as { token: string; minimumHeight: number; maximumHeight: number }
    );
    delete boundingVolume.extensions?.["3DTILES_bounding_volume_S2"];
    if (
      boundingVolume.extensions &&
      Object.keys(boundingVolume.extensions).length === 0
    ) {
      delete boundingVolume.extensions;
    }
  }

  /**
   * Removes the given extension names from `extensionsUsed` and
   * `extensionsRequired`, unless an `extensions` object with that
   * name still appears somewhere in the tileset (for example, an
   * S2 bounding volume that could not be converted to a region).
   */
  private static removeExtensionDeclarations(
    tileset: Tileset,
    names: string[]
  ): void {
    const used = TilesetDowngrader.collectUsedExtensionNames(tileset);
    for (const name of names) {
      if (used.has(name)) {
        continue;
      }
      Extensions.removeExtensionUsed(tileset, name);
      Extensions.removeExtensionRequired(tileset, name);
    }
  }

  /**
   * Collects the names of all extension objects that appear on the
   * tileset, its tiles, their bounding volumes, and their contents
   */
  static collectUsedExtensionNames(tileset: Tileset): Set<string> {
    const names = new Set<string>();
    const add = (extensions: { [key: string]: any } | undefined) => {
      if (!extensions) {
        return;
      }
      for (const name of Object.keys(extensions)) {
        names.add(name);
      }
    };
    add(tileset.extensions);
    TilesetDowngrader.forEachTile(tileset.root, (tile: Tile) => {
      add(tile.extensions);
      add(tile.boundingVolume?.extensions);
      add(tile.viewerRequestVolume?.extensions);
      for (const content of Tiles.getContents(tile)) {
        add(content.extensions);
        add(content.boundingVolume?.extensions);
      }
    });
    return names;
  }

  private static deleteEmptyExtensionArrays(tileset: Tileset): void {
    if (tileset.extensionsUsed && tileset.extensionsUsed.length === 0) {
      delete tileset.extensionsUsed;
    }
    if (tileset.extensionsRequired && tileset.extensionsRequired.length === 0) {
      delete tileset.extensionsRequired;
    }
  }

  private static forEachTile(
    root: Tile,
    callback: (tile: Tile, path: string) => void
  ): void {
    const stack: { tile: Tile; path: string }[] = [
      { tile: root, path: "root" },
    ];
    while (stack.length > 0) {
      const { tile, path } = stack.pop() as { tile: Tile; path: string };
      callback(tile, path);
      const children = tile.children;
      if (children) {
        for (let i = 0; i < children.length; i++) {
          stack.push({ tile: children[i], path: `${path}/children[${i}]` });
        }
      }
    }
  }
}
