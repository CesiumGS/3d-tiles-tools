import { Math as CesiumMath } from "cesium";
import { Matrix3 } from "cesium";
import { Cartesian3 } from "cesium";

import { BoundingVolumes } from "../../../src/tools";
import { ResourceResolver } from "../../../src/base";
import { Tile } from "../../../src/structure";

import { BoundingVolumeRefiner } from "../../../src/tools";

/**
 * A resource resolver for tiles without content
 */
const noContentResolver: ResourceResolver = {
  resolveUri: (uri: string) => uri,
  resolveData: async () => undefined,
  resolveDataPartial: async () => undefined,
  derive: () => noContentResolver,
};

function boxContainsCorners(
  parentBox: number[],
  childBox: number[],
  epsilon: number
): boolean {
  const corners = BoundingVolumes.computeBoundingVolumeBoxCorners(childBox);
  return corners.every((c) =>
    BoundingVolumeRefiner.boxContainsPoint(parentBox, c, epsilon)
  );
}

describe("BoundingVolumeRefiner", function () {
  describe("boxContainsPoint", function () {
    it("handles regular boxes", function () {
      const box = [0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 0.5];
      expect(
        BoundingVolumeRefiner.boxContainsPoint(box, [1.9, 0.9, 0.4], 0)
      ).toBeTrue();
      expect(
        BoundingVolumeRefiner.boxContainsPoint(box, [2.1, 0, 0], 0)
      ).toBeFalse();
      expect(
        BoundingVolumeRefiner.boxContainsPoint(box, [0, 0, -0.6], 0)
      ).toBeFalse();
    });

    it("handles rotated boxes", function () {
      const angle = CesiumMath.toRadians(45);
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      // Half axes: x rotated 45 degrees with length 2, y with length 1, z unit
      const box = [0, 0, 0, 2 * c, 2 * s, 0, -s, c, 0, 0, 0, 1];
      expect(
        BoundingVolumeRefiner.boxContainsPoint(box, [1.9 * c, 1.9 * s, 0], 0)
      ).toBeTrue();
      // A point that is inside the axis-aligned bounding box of the
      // rotated box, but outside the rotated box itself
      expect(
        BoundingVolumeRefiner.boxContainsPoint(box, [1.4, -1.4, 0], 0)
      ).toBeFalse();
    });

    it("handles degenerate (flat) boxes", function () {
      const box = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0];
      expect(
        BoundingVolumeRefiner.boxContainsPoint(box, [0.5, 0.5, 0], 1e-9)
      ).toBeTrue();
      expect(
        BoundingVolumeRefiner.boxContainsPoint(box, [0.5, 0.5, 0.01], 1e-9)
      ).toBeFalse();
    });
  });

  describe("refine with boxes", function () {
    it("unions children bottom-up and keeps the parent orientation", async function () {
      const angle = CesiumMath.toRadians(30);
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const rotation = Matrix3.fromArray([c, s, 0, -s, c, 0, 0, 0, 1]);

      // A rotated parent box with half extents (4, 4, 1)
      const parentBox = [0, 0, 0, 4 * c, 4 * s, 0, -4 * s, 4 * c, 0, 0, 0, 1];

      // Two small children, given as axis-aligned boxes in the (already
      // rotated) parent frame: express their centers in world coordinates
      const childCenterA = Matrix3.multiplyByVector(
        rotation,
        new Cartesian3(1, 1, 0),
        new Cartesian3()
      );
      const childCenterB = Matrix3.multiplyByVector(
        rotation,
        new Cartesian3(-2, 0.5, 0.2),
        new Cartesian3()
      );
      const childA: Tile = {
        boundingVolume: {
          box: [
            childCenterA.x,
            childCenterA.y,
            childCenterA.z,
            0.5 * c,
            0.5 * s,
            0,
            -0.5 * s,
            0.5 * c,
            0,
            0,
            0,
            0.1,
          ],
        },
        geometricError: 1,
      };
      const childB: Tile = {
        boundingVolume: {
          box: [
            childCenterB.x,
            childCenterB.y,
            childCenterB.z,
            0.25 * c,
            0.25 * s,
            0,
            -0.25 * s,
            0.25 * c,
            0,
            0,
            0,
            0.1,
          ],
        },
        geometricError: 1,
      };
      const parent: Tile = {
        boundingVolume: { box: parentBox },
        geometricError: 2,
        children: [childA, childB],
      };

      const stats = await BoundingVolumeRefiner.refine(
        parent,
        noContentResolver,
        {
          padding: 0,
        }
      );

      // The children have no content and no children, so they keep their
      // boxes; the parent is refined to their union
      expect(stats.tilesRefined).toBe(1);
      expect(stats.tilesKeptOriginal).toBe(2);
      const refined = parent.boundingVolume.box as number[];

      // Orientation is preserved: half axes are parallel to the original ones
      const halfAxes = Matrix3.fromArray(refined, 3, new Matrix3());
      for (let i = 0; i < 3; i++) {
        const axis = Matrix3.getColumn(halfAxes, i, new Cartesian3());
        const original = Matrix3.getColumn(rotation, i, new Cartesian3());
        Cartesian3.normalize(axis, axis);
        expect(Math.abs(Cartesian3.dot(axis, original))).toBeCloseTo(1, 9);
      }

      // The parent contains both children, and is much smaller than before
      expect(
        boxContainsCorners(refined, childA.boundingVolume.box as number[], 1e-9)
      ).toBeTrue();
      expect(
        boxContainsCorners(refined, childB.boundingVolume.box as number[], 1e-9)
      ).toBeTrue();
      const volumeBefore = BoundingVolumeRefiner.computeVolume({
        box: parentBox,
      }) as number;
      const volumeAfter = BoundingVolumeRefiner.computeVolume({
        box: refined,
      }) as number;
      expect(volumeAfter).toBeLessThan(volumeBefore * 0.25);

      // In the parent frame, the union spans x from -2.25 to 1.5 and
      // y from 0.25 to 1.5, so the half extents are (1.875, 0.625)
      const xAxis = Matrix3.getColumn(halfAxes, 0, new Cartesian3());
      const yAxis = Matrix3.getColumn(halfAxes, 1, new Cartesian3());
      expect(Cartesian3.magnitude(xAxis)).toBeCloseTo(1.875, 9);
      expect(Cartesian3.magnitude(yAxis)).toBeCloseTo(0.625, 9);
    });

    it("applies padding", async function () {
      const child: Tile = {
        boundingVolume: { box: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1] },
        geometricError: 1,
      };
      const parent: Tile = {
        boundingVolume: { box: [0, 0, 0, 10, 0, 0, 0, 10, 0, 0, 0, 10] },
        geometricError: 2,
        children: [child],
      };
      await BoundingVolumeRefiner.refine(parent, noContentResolver, {
        padding: 0.5,
      });
      const refined = parent.boundingVolume.box as number[];
      expect(refined[3]).toBeCloseTo(1.5, 9);
      expect(refined[7]).toBeCloseTo(1.5, 9);
      expect(refined[11]).toBeCloseTo(1.5, 9);
    });

    it("keeps the original box when there is nothing to refine with", async function () {
      const original = [0, 0, 0, 10, 0, 0, 0, 10, 0, 0, 0, 10];
      const tile: Tile = {
        boundingVolume: { box: original.slice() },
        geometricError: 2,
      };
      const stats = await BoundingVolumeRefiner.refine(
        tile,
        noContentResolver,
        {
          padding: 0,
        }
      );
      expect(stats.tilesKeptOriginal).toBe(1);
      expect(tile.boundingVolume.box).toEqual(original);
    });
  });

  describe("refine with regions", function () {
    it("unions child regions into the parent", async function () {
      const d = CesiumMath.toRadians;
      const childA: Tile = {
        boundingVolume: { region: [d(10), d(50), d(11), d(51), 0, 100] },
        geometricError: 1,
      };
      const childB: Tile = {
        boundingVolume: { region: [d(12), d(52), d(13), d(53), -5, 80] },
        geometricError: 1,
      };
      const parent: Tile = {
        boundingVolume: { region: [d(0), d(40), d(20), d(60), -1000, 1000] },
        geometricError: 2,
        children: [childA, childB],
      };
      await BoundingVolumeRefiner.refine(parent, noContentResolver, {
        padding: 0,
      });
      const r = parent.boundingVolume.region as number[];
      expect(r[0]).toBeCloseTo(d(10), 9);
      expect(r[1]).toBeCloseTo(d(50), 9);
      expect(r[2]).toBeCloseTo(d(13), 9);
      expect(r[3]).toBeCloseTo(d(53), 9);
      expect(r[4]).toBeCloseTo(-5, 9);
      expect(r[5]).toBeCloseTo(100, 9);
    });

    it("handles regions across the antimeridian", async function () {
      const d = CesiumMath.toRadians;
      // Parent spans from 170 E across the antimeridian to 170 W
      const childA: Tile = {
        boundingVolume: { region: [d(178), d(-10), d(179), d(-9), 0, 10] },
        geometricError: 1,
      };
      const childB: Tile = {
        boundingVolume: { region: [d(-179), d(-8), d(-178), d(-7), 0, 10] },
        geometricError: 1,
      };
      const parent: Tile = {
        boundingVolume: { region: [d(170), d(-20), d(-170), d(0), -100, 100] },
        geometricError: 2,
        children: [childA, childB],
      };
      await BoundingVolumeRefiner.refine(parent, noContentResolver, {
        padding: 0,
      });
      const r = parent.boundingVolume.region as number[];
      expect(r[0]).toBeCloseTo(d(178), 9);
      expect(r[2]).toBeCloseTo(d(-178), 9);
      expect(r[1]).toBeCloseTo(d(-10), 9);
      expect(r[3]).toBeCloseTo(d(-7), 9);
    });

    it("converts S2 cells to regions", async function () {
      // A face cell (level 0), covering a large area; with no content
      // and no children the cell corners are used
      const tile: Tile = {
        boundingVolume: {
          extensions: {
            "3DTILES_bounding_volume_S2": {
              token: "1",
              minimumHeight: 0,
              maximumHeight: 500,
            },
          },
        },
        geometricError: 1,
      };
      const stats = await BoundingVolumeRefiner.refine(
        tile,
        noContentResolver,
        {
          padding: 0,
        }
      );
      expect(stats.tilesRefined).toBe(1);
      expect(tile.boundingVolume.region).toBeDefined();
      expect(tile.boundingVolume.extensions).toBeUndefined();
      const r = tile.boundingVolume.region as number[];
      expect(r[4]).toBeCloseTo(0, 9);
      expect(r[5]).toBeCloseTo(500, 9);
      expect(r[1]).toBeLessThan(r[3]);
      // Face 0 is centered on the equator at longitude 0 and reaches
      // 45 degrees of latitude at the meridian (edge extremum), beyond
      // its vertices at about 35.26 degrees
      expect(r[3]).toBeCloseTo(CesiumMath.toRadians(45), 6);
      expect(r[1]).toBeCloseTo(CesiumMath.toRadians(-45), 6);
      expect(r[0]).toBeCloseTo(CesiumMath.toRadians(-45), 6);
      expect(r[2]).toBeCloseTo(CesiumMath.toRadians(45), 6);
    });

    it("converts polar S2 cells to full-longitude regions", function () {
      // Face 2 (token "5") contains the north pole
      const region = BoundingVolumeRefiner.s2ToRegion({
        token: "5",
        minimumHeight: 0,
        maximumHeight: 10,
      });
      expect(region[0]).toBeCloseTo(-CesiumMath.PI, 9);
      expect(region[2]).toBeCloseTo(CesiumMath.PI, 9);
      expect(region[3]).toBeCloseTo(CesiumMath.PI_OVER_TWO, 9);
      expect(region[1]).toBeCloseTo(CesiumMath.toRadians(35.26), 2);
    });

    it("unions a full-circle child region without collapsing it", async function () {
      const d = CesiumMath.toRadians;
      const child: Tile = {
        boundingVolume: {
          region: [-CesiumMath.PI, d(80), CesiumMath.PI, d(90), 0, 10],
        },
        geometricError: 1,
      };
      const parent: Tile = {
        boundingVolume: { region: [d(10), d(60), d(50), d(90), -100, 100] },
        geometricError: 2,
        children: [child],
      };
      await BoundingVolumeRefiner.refine(parent, noContentResolver, {
        padding: 0,
      });
      const r = parent.boundingVolume.region as number[];
      expect(r[0]).toBeCloseTo(-CesiumMath.PI, 9);
      expect(r[2]).toBeCloseTo(CesiumMath.PI, 9);
      expect(r[1]).toBeCloseTo(d(80), 9);
      expect(r[3]).toBeCloseTo(d(90), 9);
    });
  });
});
