import fs from "fs";
import path from "path";

import { ContentDataTypeRegistry } from "../../base";
import { ContentDataTypes } from "../../base";
import { ContentOps } from "../contentProcessing/ContentOps";
import { Buffers } from "../../base";
import { GltfUtilities } from "../contentProcessing/GltfUtilities";
import { Loggers } from "../../base";
import { Paths } from "../../base";
import { Tile } from "../../structure";
import { Tiles } from "../../tilesets";
import { Tileset } from "../../structure";
import { Tilesets } from "../../tilesets";
import { TilesetSourceResourceResolver } from "../../tilesets";
import { TilesetSources } from "../../tilesets";
import { TilesetTarget } from "../../tilesets";
import { TilesetTargets } from "../../tilesets";
import { TilesetTraversers } from "../../tilesets";

import { BoundingVolumeRefiner } from "./BoundingVolumeRefiner";
import { RefinementStats } from "./BoundingVolumeRefiner";
import { ConversionReport } from "./ConversionReport";
import { ConversionReports } from "./ConversionReport";
import { OutputInfo } from "./ConversionReport";
import { DirectoryTilesetTarget } from "./DirectoryTilesetTarget";
import { ExplicitHierarchyBuilder } from "./ExplicitHierarchyBuilder";
import { DowngradeError } from "./TilesetDowngrader";
import { TilesetDowngrader } from "./TilesetDowngrader";
import { Validation } from "./Validation";
import { ValidationSummary } from "./Validation";

const logger = Loggers.get("tilesetProcessing");

/**
 * The 3D Tiles versions that can be written
 */
export type TargetVersion = "1.0" | "1.1";

/**
 * Options for the conversion
 */
export type ConversionOptions = {
  /**
   * The versions to write. When more than one version is given, each
   * is written into a subdirectory of the output that is named after
   * the version (`1.0`, `1.1`).
   */
  targetVersions: TargetVersion[];

  /**
   * How bounding volumes are computed: `content` tightens them from
   * the actual tile content, `derived` keeps the volumes that follow
   * from the implicit subdivision.
   */
  bounds: "content" | "derived";

  /**
   * Padding in meters for refined bounding volumes
   */
  padding: number;

  /**
   * Whether existing output may be overwritten
   */
  overwrite: boolean;

  /**
   * Whether the outputs are validated with the 3D Tiles Validator
   */
  validate: boolean;

  /**
   * Whether the validator also validates tile content
   */
  validateContent: boolean;
};

/**
 * One open output target and the information needed to fill it
 */
type Target = {
  version: TargetVersion;
  name: string;
  tilesetJsonFileName: string;
  tilesetJsonPath: string;
  target: TilesetTarget;
  entriesWritten: number;
  glbConvertedToB3dm: number;

  /**
   * Maps source entry keys to the keys they received in this target
   */
  keyMapping: Map<string, string>;
};

/**
 * Converts 3D Tiles 1.1 tilesets with implicit tiling into explicit
 * tilesets, for 3D Tiles 1.0 (with B3DM content) and/or 1.1 (with
 * glTF content).
 *
 * The traversal of the implicit hierarchy and the refinement of the
 * bounding volumes are performed once. Each requested target version
 * is then written from the same in-memory hierarchy, in a single pass
 * over the input files.
 */
export class ImplicitToExplicit {
  /**
   * Performs the conversion.
   *
   * @param input - The input tileset (a `tileset.json` path, a
   * directory containing one, or a 3TZ/3DTILES package)
   * @param output - The output (a directory or `tileset.json` path).
   * For multiple target versions, subdirectories are created.
   * @param options - The options
   * @returns The conversion report
   */
  static async convert(
    input: string,
    output: string,
    options: ConversionOptions
  ): Promise<ConversionReport> {
    const startTime = Date.now();
    ImplicitToExplicit.validateOptions(output, options);

    // Directory names that contain a dot would be mistaken for file
    // names by the tileset source, so always point at the JSON file
    if (Paths.isDirectory(input)) {
      input = path.join(input, "tileset.json");
    }
    const tilesetSourceJsonFileName =
      Tilesets.determineTilesetJsonFileName(input);
    const tilesetSource = await TilesetSources.createAndOpen(input);
    const targets: Target[] = [];
    try {
      const tileset = await TilesetSources.parseSourceValue<Tileset>(
        tilesetSource,
        tilesetSourceJsonFileName
      );

      // Traverse the implicit hierarchy once
      const normalized =
        ExplicitHierarchyBuilder.normalizeLegacyImplicitTiling(tileset);
      if (normalized > 0) {
        logger.info(
          `Normalized ${normalized} legacy 3DTILES_implicit_tiling extension objects`
        );
      }
      const inputTileCountExplicit =
        ImplicitToExplicit.countExplicitTiles(tileset);
      if (!ImplicitToExplicit.containsImplicitTiling(tileset)) {
        logger.warn(
          `${input} does not contain implicit tiling; the tileset is ` +
            `converted anyway`
        );
      } else if (tileset.schema || tileset.schemaUri) {
        logger.warn(
          "The tileset defines a metadata schema. Tile and content metadata " +
            "that is stored in subtree files is not carried over to the " +
            "explicit tiles (metadata inside glTF content is unaffected)."
        );
      }
      logger.info(`Traversing implicit tile hierarchy of ${input}`);
      const traversedRoot =
        await TilesetTraversers.createTraversedRootTileForTileset(
          tilesetSource,
          tileset
        );
      const hierarchy = await ExplicitHierarchyBuilder.build(traversedRoot);
      logger.info(
        `Built explicit hierarchy with ${hierarchy.tileCount} tiles ` +
          `(${hierarchy.implicitTileCount} from implicit tiling, ` +
          `${hierarchy.contentTileCount} with content, depth ${hierarchy.maxDepth})`
      );
      ImplicitToExplicit.validateHierarchy(hierarchy.root, options);

      const explicitTileset: Tileset = {
        asset: tileset.asset,
        properties: tileset.properties,
        schema: tileset.schema,
        schemaUri: tileset.schemaUri,
        statistics: tileset.statistics,
        groups: tileset.groups,
        metadata: tileset.metadata,
        geometricError: tileset.geometricError,
        root: hierarchy.root,
        extensionsUsed: tileset.extensionsUsed,
        extensionsRequired: tileset.extensionsRequired,
        extensions: tileset.extensions,
        extras: tileset.extras,
      };

      // Refine the bounding volumes once
      let refinement: RefinementStats | undefined;
      if (options.bounds === "content") {
        logger.info("Refining bounding volumes from tile content");
        const resourceResolver = new TilesetSourceResourceResolver(
          ".",
          tilesetSource
        );
        refinement = await BoundingVolumeRefiner.refine(
          explicitTileset.root,
          resourceResolver,
          { padding: options.padding }
        );
        BoundingVolumeRefiner.logSummary(refinement);
        const removedSemantics =
          TilesetDowngrader.removeBoundingVolumeSemantics(explicitTileset);
        if (removedSemantics > 0) {
          logger.info(
            `Removed ${removedSemantics} stale bounding volume metadata ` +
              `properties (TILE_BOUNDING_BOX and similar semantics)`
          );
        }
      }

      // Open all targets
      for (const version of options.targetVersions) {
        targets.push(
          await ImplicitToExplicit.openTarget(
            output,
            version,
            options.targetVersions.length > 1,
            options.overwrite
          )
        );
      }

      // Copy and convert all entries in a single pass
      const subtreeKeys = new Set(
        hierarchy.subtreeUris.map((u) => ImplicitToExplicit.normalizeKey(u))
      );
      const gltfExtensionsRequired: { [name: string]: number } = {};
      const gltfExtensionsUsed: { [name: string]: number } = {};
      let subtreeFilesSkipped = 0;
      const entries = await TilesetSources.getEntries(tilesetSource);
      for await (const entry of entries) {
        const key = entry.key;
        if (key === tilesetSourceJsonFileName) {
          continue;
        }
        if (subtreeKeys.has(ImplicitToExplicit.normalizeKey(key))) {
          subtreeFilesSkipped++;
          continue;
        }
        let data = entry.value;
        if (Buffers.isGzipped(data)) {
          data = Buffers.gunzip(data);
        }
        const type = await ContentDataTypeRegistry.findType(key, data);
        if (type === ContentDataTypes.CONTENT_TYPE_SUBT) {
          subtreeFilesSkipped++;
          continue;
        }
        if (type === ContentDataTypes.CONTENT_TYPE_TILESET) {
          logger.warn(
            `${key} is a tileset JSON file. It is copied unchanged; tiles ` +
              `that it contains are not converted.`
          );
        }
        if (type === ContentDataTypes.CONTENT_TYPE_GLB) {
          ImplicitToExplicit.auditGltfExtensions(
            key,
            data,
            gltfExtensionsRequired,
            gltfExtensionsUsed
          );
        }
        for (const target of targets) {
          await ImplicitToExplicit.writeEntry(target, key, data, type);
        }
      }

      // Write the tileset JSON of each target, and finish it
      const outputs: OutputInfo[] = [];
      for (const target of targets) {
        const versionTileset: Tileset = JSON.parse(
          JSON.stringify(explicitTileset)
        );
        if (target.version === "1.0") {
          TilesetDowngrader.downgradeTo10(versionTileset, (uri: string) =>
            ImplicitToExplicit.mapContentUri(target, uri)
          );
        } else {
          TilesetDowngrader.finalize11(versionTileset);
        }
        const json = JSON.stringify(versionTileset, null, 2);
        await target.target.addEntry(
          target.tilesetJsonFileName,
          Buffer.from(json)
        );
        await target.target.end();
        logger.info(
          `Wrote 3D Tiles ${target.version} tileset to ${target.tilesetJsonPath} ` +
            `(${target.entriesWritten} files, ` +
            `${target.glbConvertedToB3dm} GLB converted to B3DM)`
        );

        const containment = ConversionReports.checkContainment(versionTileset);
        if (containment.pairsFailed > 0) {
          logger.warn(
            `${containment.pairsFailed} of ${containment.pairsChecked} child ` +
              `bounding volumes are not contained in their parent in the ` +
              `${target.version} output`
          );
        }

        let validation: ValidationSummary | undefined = undefined;
        if (options.validate) {
          validation = await Validation.validateTileset(
            target.tilesetJsonPath,
            options.validateContent,
            true
          );
        }
        outputs.push({
          version: target.version,
          tilesetJsonPath: target.tilesetJsonPath,
          entriesWritten: target.entriesWritten,
          glbConvertedToB3dm: target.glbConvertedToB3dm,
          containment: containment,
          validation: validation,
        });
      }
      targets.length = 0;

      const report: ConversionReport = {
        input: input,
        timestamp: new Date().toISOString(),
        durationMilliseconds: Date.now() - startTime,
        inputTileCountExplicit: inputTileCountExplicit,
        outputTileCount: hierarchy.tileCount,
        implicitTileCount: hierarchy.implicitTileCount,
        contentTileCount: hierarchy.contentTileCount,
        maxDepth: hierarchy.maxDepth,
        subtreeFilesSkipped: subtreeFilesSkipped,
        boundsMode: options.bounds,
        refinement: refinement,
        gltfExtensionsRequired: gltfExtensionsRequired,
        gltfExtensionsUsed: gltfExtensionsUsed,
        outputs: outputs,
      };
      ImplicitToExplicit.writeReport(output, report);
      return report;
    } finally {
      for (const target of targets) {
        try {
          await target.target.end();
        } catch (e) {
          // Error is already being propagated
        }
      }
      await tilesetSource.close();
    }
  }

  /**
   * Checks the options and the output name before any work is done
   */
  private static validateOptions(
    output: string,
    options: ConversionOptions
  ): void {
    if (options.targetVersions.length === 0) {
      throw new Error("At least one target version is required");
    }
    if (!Number.isFinite(options.padding) || options.padding < 0) {
      throw new Error(
        `The padding must be a non-negative number, but is ${options.padding}`
      );
    }
    if (options.targetVersions.length > 1) {
      const lower = output.toLowerCase();
      if (lower.endsWith(".3tz") || lower.endsWith(".3dtiles")) {
        throw new Error(
          "Multiple target versions require a directory output, not a package file"
        );
      }
    }
  }

  /**
   * Checks the explicit hierarchy for features that cannot be written
   * for the requested versions, before any output is created
   */
  private static validateHierarchy(
    root: Tile,
    options: ConversionOptions
  ): void {
    const wants10 = options.targetVersions.includes("1.0");
    const stack: { tile: Tile; path: string }[] = [
      { tile: root, path: "root" },
    ];
    while (stack.length > 0) {
      const { tile, path: tilePath } = stack.pop() as {
        tile: Tile;
        path: string;
      };
      const contents = Tiles.getContents(tile);
      for (const content of contents) {
        if (
          ImplicitToExplicit.normalizeKey(content.uri)
            .toLowerCase()
            .endsWith(".json")
        ) {
          throw new DowngradeError(
            `Tile ${tilePath} refers to the external tileset ${content.uri}. ` +
              `External tilesets are not converted; run "3d-tiles-tools combine" ` +
              `on the input first.`
          );
        }
      }
      if (wants10 && contents.length > 1) {
        throw new DowngradeError(
          `Tile ${tilePath} has ${contents.length} contents. 3D Tiles 1.0 ` +
            `supports a single content per tile. Use --targetVersion 1.1 ` +
            `for this tileset.`
        );
      }
      const children = tile.children ?? [];
      for (let i = 0; i < children.length; i++) {
        stack.push({ tile: children[i], path: `${tilePath}/children[${i}]` });
      }
    }
  }

  private static containsImplicitTiling(tileset: Tileset): boolean {
    const stack = [tileset.root];
    while (stack.length > 0) {
      const tile = stack.pop() as Tile;
      if (tile.implicitTiling) {
        return true;
      }
      if (tile.children) {
        stack.push(...tile.children);
      }
    }
    return false;
  }

  /**
   * Maps a content URI of the 1.0 tileset to the key that the content
   * received in the given target. URIs that were not seen during the
   * entry pass (for example, percent-encoded or absolute URIs) are
   * renamed by extension with a warning.
   */
  private static mapContentUri(target: Target, uri: string): string {
    const normalized = ImplicitToExplicit.normalizeKey(uri);
    let mapped = target.keyMapping.get(normalized);
    if (mapped === undefined) {
      try {
        mapped = target.keyMapping.get(decodeURIComponent(normalized));
      } catch (e) {
        // Not a valid percent-encoding; fall through
      }
    }
    if (mapped !== undefined) {
      return mapped;
    }
    if (normalized.toLowerCase().endsWith(".glb")) {
      logger.warn(
        `Content URI ${uri} did not match any input file; renaming it to ` +
          `.b3dm without verification`
      );
      return ImplicitToExplicit.replaceExtension(uri, ".glb", ".b3dm");
    }
    return uri;
  }

  /**
   * Opens the output target for the given version
   */
  private static async openTarget(
    output: string,
    version: TargetVersion,
    useVersionSubdirectory: boolean,
    overwrite: boolean
  ): Promise<Target> {
    const tilesetJsonFileName = Tilesets.determineTilesetJsonFileName(output);
    const lower = output.toLowerCase();
    const isPackage = lower.endsWith(".3tz") || lower.endsWith(".3dtiles");
    let target: TilesetTarget;
    let name: string;
    let tilesetJsonPath: string;
    if (isPackage) {
      name = output;
      tilesetJsonPath = output;
      target = await TilesetTargets.createAndBegin(name, overwrite);
    } else {
      let directory = Tilesets.determineTilesetDirectoryName(output);
      if (useVersionSubdirectory) {
        directory = path.join(directory, version);
      }
      name = directory;
      tilesetJsonPath = path.join(directory, tilesetJsonFileName);
      const directoryTarget = new DirectoryTilesetTarget();
      await directoryTarget.begin(directory, overwrite);
      target = directoryTarget;
    }
    return {
      version: version,
      name: name,
      tilesetJsonFileName: tilesetJsonFileName,
      tilesetJsonPath: tilesetJsonPath,
      target: target,
      entriesWritten: 0,
      glbConvertedToB3dm: 0,
      keyMapping: new Map<string, string>(),
    };
  }

  /**
   * Writes one source entry into the given target, converting GLB
   * into B3DM for 1.0 targets
   */
  private static async writeEntry(
    target: Target,
    key: string,
    data: Buffer,
    type: string | undefined
  ): Promise<void> {
    let targetKey = key;
    let targetData = data;
    if (target.version === "1.0") {
      if (type === ContentDataTypes.CONTENT_TYPE_GLB) {
        targetData = ContentOps.glbToB3dmBuffer(data);
        targetKey = ImplicitToExplicit.replaceExtension(key, ".glb", ".b3dm");
        target.glbConvertedToB3dm++;
      } else if (type === ContentDataTypes.CONTENT_TYPE_GLTF) {
        logger.warn(
          `${key} is a JSON glTF and cannot be wrapped into B3DM. It is ` +
            `copied unchanged and will not be valid 3D Tiles 1.0 content.`
        );
      }
    }
    target.keyMapping.set(
      ImplicitToExplicit.normalizeKey(key),
      ImplicitToExplicit.normalizeKey(targetKey)
    );
    await target.target.addEntry(targetKey, targetData);
    target.entriesWritten++;
  }

  /**
   * Records the glTF extensions that are used and required by the
   * given GLB data
   */
  private static auditGltfExtensions(
    key: string,
    glb: Buffer,
    required: { [name: string]: number },
    used: { [name: string]: number }
  ): void {
    try {
      const json = JSON.parse(GltfUtilities.extractJsonFromGlb(glb).toString());
      for (const name of json.extensionsRequired ?? []) {
        required[name] = (required[name] ?? 0) + 1;
      }
      for (const name of json.extensionsUsed ?? []) {
        used[name] = (used[name] ?? 0) + 1;
      }
    } catch (e) {
      logger.warn(`Could not read glTF JSON from ${key}: ${e}`);
    }
  }

  private static replaceExtension(
    key: string,
    oldExtension: string,
    newExtension: string
  ): string {
    if (key.toLowerCase().endsWith(oldExtension)) {
      return key.substring(0, key.length - oldExtension.length) + newExtension;
    }
    return key + newExtension;
  }

  /**
   * Normalizes a key or relative URI for comparisons: forward slashes,
   * no leading `./`, no query or fragment
   */
  static normalizeKey(key: string): string {
    let k = key.replace(/\\/g, "/");
    const queryIndex = k.search(/[?#]/);
    if (queryIndex >= 0) {
      k = k.substring(0, queryIndex);
    }
    while (k.startsWith("./")) {
      k = k.substring(2);
    }
    return k;
  }

  private static countExplicitTiles(tileset: Tileset): number {
    let count = 0;
    const stack = [tileset.root];
    while (stack.length > 0) {
      const tile = stack.pop();
      if (!tile) {
        continue;
      }
      count++;
      if (tile.children) {
        stack.push(...tile.children);
      }
    }
    return count;
  }

  private static writeReport(output: string, report: ConversionReport): void {
    const directory = Tilesets.determineTilesetDirectoryName(output);
    try {
      fs.mkdirSync(directory, { recursive: true });
      const reportPath = path.join(directory, "conversion-report.json");
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      logger.info(`Wrote conversion report to ${reportPath}`);
    } catch (e) {
      logger.warn(`Could not write conversion report: ${e}`);
    }
  }
}
