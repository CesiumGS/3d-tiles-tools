import fs from "fs";
import path from "path";
import { SpecHelpers } from "../../SpecHelpers";

import { Tile } from "../../../src/structure";
import { Tileset } from "../../../src/structure";
import { VertexProcessing } from "../../../src/tools";

import { ImplicitToExplicit } from "../../../src/tools";
import { ConversionReport } from "../../../src/tools";

const SPECS_DATA_BASE_DIRECTORY =
  SpecHelpers.getSpecsDataBaseDirectory() + "/tilesetProcessing";
const OUTPUT_BASE_DIRECTORY =
  SpecHelpers.getSpecsDataBaseDirectory() +
  "/output/tilesetProcessing/implicitToExplicit";

function readTileset(tilesetJsonPath: string): Tileset {
  return JSON.parse(fs.readFileSync(tilesetJsonPath).toString()) as Tileset;
}

function collectTiles(root: Tile): Tile[] {
  const tiles: Tile[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const tile = stack.pop() as Tile;
    tiles.push(tile);
    if (tile.children) {
      stack.push(...tile.children);
    }
  }
  return tiles;
}

function collectContentUris(root: Tile): string[] {
  const uris: string[] = [];
  for (const tile of collectTiles(root)) {
    if (tile.content) {
      uris.push(tile.content.uri);
    }
    for (const content of tile.contents ?? []) {
      uris.push(content.uri);
    }
  }
  return uris;
}

function listFilesRecursively(directory: string): string[] {
  const result: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      result.push(...listFilesRecursively(full));
    } else {
      result.push(full);
    }
  }
  return result;
}

/**
 * The expected explicit tile counts, determined from the subtree
 * availability of the samples
 */
const SAMPLES: { name: string; tileCount: number; contentTileCount: number }[] =
  [
    { name: "SparseImplicitQuadtree", tileCount: 63, contentTileCount: 32 },
    { name: "SparseImplicitOctree", tileCount: 58, contentTileCount: 31 },
    { name: "implicitProcessing", tileCount: 21, contentTileCount: 21 },
  ];

describe("ImplicitToExplicit", function () {
  beforeAll(function () {
    fs.rmSync(OUTPUT_BASE_DIRECTORY, { recursive: true, force: true });
  });

  for (const sample of SAMPLES) {
    describe(`with ${sample.name}`, function () {
      let report: ConversionReport;
      let tileset10: Tileset;
      let tileset11: Tileset;
      let outputDirectory: string;
      let fromContentSpy: jasmine.Spy;

      beforeAll(async function () {
        fromContentSpy = spyOn(
          VertexProcessing,
          "fromContent"
        ).and.callThrough();
        outputDirectory = path.join(OUTPUT_BASE_DIRECTORY, sample.name);
        report = await ImplicitToExplicit.convert(
          path.join(SPECS_DATA_BASE_DIRECTORY, sample.name, "tileset.json"),
          outputDirectory,
          {
            targetVersions: ["1.0", "1.1"],
            bounds: "content",
            padding: 0,
            overwrite: true,
            validate: true,
            validateContent: true,
          }
        );
        tileset10 = readTileset(path.join(outputDirectory, "1.0/tileset.json"));
        tileset11 = readTileset(path.join(outputDirectory, "1.1/tileset.json"));
      }, 60000);

      it("creates one explicit tile per available implicit tile", function () {
        expect(report.outputTileCount).toBe(sample.tileCount);
        expect(report.contentTileCount).toBe(sample.contentTileCount);
        expect(collectTiles(tileset10.root).length).toBe(sample.tileCount);
        expect(collectTiles(tileset11.root).length).toBe(sample.tileCount);
      });

      it("reads each content only once for two target versions", function () {
        expect(fromContentSpy.calls.count()).toBe(sample.contentTileCount);
      });

      it("writes a 1.0 tileset without 1.1 features", function () {
        expect(tileset10.asset.version).toBe("1.0");
        expect(tileset10.schema).toBeUndefined();
        expect(tileset10.schemaUri).toBeUndefined();
        expect(tileset10.metadata).toBeUndefined();
        expect(tileset10.extensionsUsed ?? []).not.toContain(
          "3DTILES_implicit_tiling"
        );
        for (const tile of collectTiles(tileset10.root)) {
          expect(tile.implicitTiling).toBeUndefined();
          expect(tile.metadata).toBeUndefined();
          expect(tile.contents).toBeUndefined();
        }
        const uris = collectContentUris(tileset10.root);
        expect(uris.length).toBe(sample.contentTileCount);
        for (const uri of uris) {
          expect(uri.endsWith(".b3dm")).toBeTrue();
          expect(
            fs.existsSync(path.join(outputDirectory, "1.0", uri))
          ).toBeTrue();
        }
      });

      it("writes a 1.1 tileset that keeps glTF content", function () {
        expect(tileset11.asset.version).toBe("1.1");
        const uris = collectContentUris(tileset11.root);
        expect(uris.length).toBe(sample.contentTileCount);
        for (const uri of uris) {
          expect(uri.endsWith(".glb")).toBeTrue();
          expect(
            fs.existsSync(path.join(outputDirectory, "1.1", uri))
          ).toBeTrue();
        }
        for (const tile of collectTiles(tileset11.root)) {
          expect(tile.implicitTiling).toBeUndefined();
        }
      });

      it("does not copy subtree files", function () {
        const files = listFilesRecursively(outputDirectory);
        const subtreeFiles = files.filter((f) => f.endsWith(".subtree"));
        expect(subtreeFiles.length).toBe(0);
        expect(report.subtreeFilesSkipped).toBeGreaterThan(0);
      });

      it("produces parent bounding volumes that contain their children", function () {
        for (const output of report.outputs) {
          expect(output.containment.pairsFailed).toBe(0);
          expect(output.containment.pairsChecked).toBe(sample.tileCount - 1);
        }
      });

      it("passes the 3D Tiles Validator without errors (when installed)", function () {
        expect(report.outputs.length).toBe(2);
        for (const output of report.outputs) {
          // The validator is an optional dependency. When it is not
          // installed, the validation summary is undefined.
          if (output.validation === undefined) {
            pending("3d-tiles-validator is not installed");
            return;
          }
          expect(output.validation.numErrors).toBe(0);
          expect(output.validation.errorMessages).toEqual([]);
          expect(
            fs.existsSync(output.validation.reportPath as string)
          ).toBeTrue();
        }
      });

      it("refines all bounding volumes without loosening them", function () {
        const refinement = report.refinement;
        expect(refinement).toBeDefined();
        expect(refinement?.tilesRefined).toBe(sample.tileCount);
        expect(refinement?.warnings).toEqual([]);
        const mean =
          (refinement?.volumeRatioSum ?? 0) / (refinement?.tilesRefined ?? 1);
        expect(mean).toBeLessThanOrEqual(1.0 + 1e-9);
      });

      it("writes a conversion report", function () {
        const reportPath = path.join(outputDirectory, "conversion-report.json");
        expect(fs.existsSync(reportPath)).toBeTrue();
        const written = JSON.parse(fs.readFileSync(reportPath).toString());
        expect(written.outputTileCount).toBe(sample.tileCount);
      });
    });
  }

  describe("with a single target version", function () {
    it("writes directly into the output directory", async function () {
      // The output directory deliberately contains a dot
      const outputDirectory = path.join(OUTPUT_BASE_DIRECTORY, "single-v1.0");
      const report = await ImplicitToExplicit.convert(
        path.join(
          SPECS_DATA_BASE_DIRECTORY,
          "implicitProcessing",
          "tileset.json"
        ),
        outputDirectory,
        {
          targetVersions: ["1.0"],
          bounds: "derived",
          padding: 0,
          overwrite: true,
          validate: false,
          validateContent: false,
        }
      );
      expect(report.outputs.length).toBe(1);
      expect(report.refinement).toBeUndefined();
      expect(
        fs.existsSync(path.join(outputDirectory, "tileset.json"))
      ).toBeTrue();
      const tileset = readTileset(path.join(outputDirectory, "tileset.json"));
      expect(tileset.asset.version).toBe("1.0");
      // Derived bounding volumes are the uniform subdivision of the root
      const root = tileset.root;
      expect(root.boundingVolume.box).toEqual([
        0.5, 0.5, 0.00625, 0.5, 0, 0, 0, 0.5, 0, 0, 0, 0.00625,
      ]);
    }, 60000);

    it("accepts a directory as input", async function () {
      const outputDirectory = path.join(OUTPUT_BASE_DIRECTORY, "dir-input");
      const report = await ImplicitToExplicit.convert(
        path.join(SPECS_DATA_BASE_DIRECTORY, "implicitProcessing"),
        outputDirectory,
        {
          targetVersions: ["1.1"],
          bounds: "derived",
          padding: 0,
          overwrite: true,
          validate: false,
          validateContent: false,
        }
      );
      expect(report.outputTileCount).toBe(21);
    }, 60000);
  });

  describe("option validation", function () {
    const input = path.join(
      SPECS_DATA_BASE_DIRECTORY,
      "implicitProcessing",
      "tileset.json"
    );
    const baseOptions = {
      targetVersions: ["1.0" as const],
      bounds: "derived" as const,
      padding: 0,
      overwrite: true,
      validate: false,
      validateContent: false,
    };

    it("rejects negative or NaN padding", async function () {
      const output = path.join(OUTPUT_BASE_DIRECTORY, "invalid");
      await expectAsync(
        ImplicitToExplicit.convert(input, output, {
          ...baseOptions,
          padding: -1,
        })
      ).toBeRejectedWithError(/padding/);
      await expectAsync(
        ImplicitToExplicit.convert(input, output, {
          ...baseOptions,
          padding: NaN,
        })
      ).toBeRejectedWithError(/padding/);
      expect(fs.existsSync(output)).toBeFalse();
    });

    it("rejects package outputs for multiple versions", async function () {
      await expectAsync(
        ImplicitToExplicit.convert(
          input,
          path.join(OUTPUT_BASE_DIRECTORY, "invalid.3tz"),
          {
            ...baseOptions,
            targetVersions: ["1.0", "1.1"],
          }
        )
      ).toBeRejectedWithError(/directory output/);
    });

    it("rejects external tilesets before writing anything", async function () {
      // Create a copy of a sample whose root refers to an external tileset
      const sourceDirectory = path.join(OUTPUT_BASE_DIRECTORY, "external-src");
      fs.mkdirSync(sourceDirectory, { recursive: true });
      const tileset = readTileset(input);
      tileset.root = {
        boundingVolume: tileset.root.boundingVolume,
        geometricError: tileset.root.geometricError,
        refine: "ADD",
        content: { uri: "inner/tileset.json" },
      };
      fs.writeFileSync(
        path.join(sourceDirectory, "tileset.json"),
        JSON.stringify(tileset)
      );
      const output = path.join(OUTPUT_BASE_DIRECTORY, "external-out");
      await expectAsync(
        ImplicitToExplicit.convert(
          path.join(sourceDirectory, "tileset.json"),
          output,
          baseOptions
        )
      ).toBeRejectedWithError(/external tileset/);
      expect(fs.existsSync(output)).toBeFalse();
    });
  });

  describe("with unreadable content", function () {
    it("keeps the original bounding volume of the affected tile", async function () {
      // Copy the sample and replace one content file with garbage
      const sourceDirectory = path.join(
        OUTPUT_BASE_DIRECTORY,
        "unreadable-src"
      );
      fs.cpSync(
        path.join(SPECS_DATA_BASE_DIRECTORY, "implicitProcessing"),
        sourceDirectory,
        {
          recursive: true,
        }
      );
      const brokenContent = path.join(
        sourceDirectory,
        "content",
        "content_0__0_0.glb"
      );
      fs.writeFileSync(brokenContent, Buffer.from("glTF but broken"));

      const report = await ImplicitToExplicit.convert(
        path.join(sourceDirectory, "tileset.json"),
        path.join(OUTPUT_BASE_DIRECTORY, "unreadable-out"),
        {
          targetVersions: ["1.1"],
          bounds: "content",
          padding: 0,
          overwrite: true,
          validate: false,
          validateContent: false,
        }
      );
      expect(report.refinement?.tilesWithUnreadableContent).toBe(1);
      expect(report.refinement?.warnings.length).toBeGreaterThan(0);
      // The root content was broken, so the root keeps its derived box
      // in x and y, expanded only as far as the refined children require
      const tileset = readTileset(
        path.join(OUTPUT_BASE_DIRECTORY, "unreadable-out", "tileset.json")
      );
      const rootBox = tileset.root.boundingVolume.box as number[];
      expect(rootBox[0]).toBeCloseTo(0.5, 9);
      expect(rootBox[1]).toBeCloseTo(0.5, 9);
      expect(rootBox[3]).toBeCloseTo(0.5, 9);
      expect(rootBox[7]).toBeCloseTo(0.5, 9);
      expect(rootBox[11]).toBeGreaterThanOrEqual(0.00625);
      // All other tiles were refined and are still contained
      expect(report.outputs[0].containment.pairsFailed).toBe(0);
    }, 60000);
  });
});
