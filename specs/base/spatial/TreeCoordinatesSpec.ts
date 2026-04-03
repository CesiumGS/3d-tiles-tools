import { OctreeCoordinates } from "../../../src/base";
import { QuadtreeCoordinates } from "../../../src/base";

describe("TreeCoordinates", function () {
  it("allows iterating over the quadtree children multiple times", function () {
    const root = new QuadtreeCoordinates(0, 0, 0);
    const children = root.children();
    const childrenA = [...children].map((c) => c.toArray());
    const childrenB = [...children].map((c) => c.toArray());
    expect(childrenA).toEqual(childrenB);
  });

  it("allows iterating over the octree children multiple times", function () {
    const root = new OctreeCoordinates(0, 0, 0, 0);
    const children = root.children();
    const childrenA = [...children].map((c) => c.toArray());
    const childrenB = [...children].map((c) => c.toArray());
    expect(childrenA).toEqual(childrenB);
  });

  it("allows iterating over the quadtree descendants multiple times", function () {
    const root = new QuadtreeCoordinates(0, 0, 0);
    const descendants = root.descendants(2, true);
    const descendantsA = [...descendants].map((c) => c.toArray());
    const descendantsB = [...descendants].map((c) => c.toArray());
    expect(descendantsA).toEqual(descendantsB);
  });

  it("allows iterating over the octree descendants multiple times", function () {
    const root = new OctreeCoordinates(0, 0, 0, 0);
    const descendants = root.descendants(2, true);
    const descendantsA = [...descendants].map((c) => c.toArray());
    const descendantsB = [...descendants].map((c) => c.toArray());
    expect(descendantsA).toEqual(descendantsB);
  });
});
