import { ImplicitTilings } from "../../../src/tilesets";

import { OctreeCoordinates } from "../../../src/base";
import { QuadtreeCoordinates } from "../../../src/base";

import { SpecHelpers } from "../../SpecHelpers";

function createQuadtreeImplicitTiling(subtreeLevels: number) {
  const implicitTiling = {
    subdivisionScheme: "QUADTREE",
    subtreeLevels: subtreeLevels,
    availableLevels: subtreeLevels * 2,
    subtrees: {
      uri: "SPEC_SUBTREES_URI",
    },
  };
  return implicitTiling;
}

function createOctreeImplicitTiling(subtreeLevels: number) {
  const implicitTiling = {
    subdivisionScheme: "OCTREE",
    subtreeLevels: subtreeLevels,
    availableLevels: subtreeLevels * 2,
    subtrees: {
      uri: "SPEC_SUBTREES_URI",
    },
  };
  return implicitTiling;
}

describe("ImplicitTilings", function () {
  it("creates a proper iterator for QUADTREE with createSubtreeCoordinatesIterator", function () {
    const implicitTiling = createQuadtreeImplicitTiling(3);
    const iterator =
      ImplicitTilings.createSubtreeCoordinatesIterator(implicitTiling);
    const actualCoordinates = [...iterator].map((c) => c.toArray());

    SpecHelpers.sortNumbersLexicographically(actualCoordinates);
    const expectedCoordinates = [
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [1, 0, 1],
      [1, 1, 1],
      [2, 0, 0],
      [2, 1, 0],
      [2, 0, 1],
      [2, 1, 1],
      [2, 2, 0],
      [2, 3, 0],
      [2, 2, 1],
      [2, 3, 1],
      [2, 0, 2],
      [2, 1, 2],
      [2, 0, 3],
      [2, 1, 3],
      [2, 2, 2],
      [2, 3, 2],
      [2, 2, 3],
      [2, 3, 3],
    ];
    SpecHelpers.sortNumbersLexicographically(expectedCoordinates);
    expect(actualCoordinates).toEqual(expectedCoordinates);
  });

  it("creates a proper iterator for OCTREE with createSubtreeCoordinatesIterator", function () {
    const implicitTiling = createOctreeImplicitTiling(3);
    const iterator =
      ImplicitTilings.createSubtreeCoordinatesIterator(implicitTiling);
    const actualCoordinates = [...iterator].map((c) => c.toArray());

    SpecHelpers.sortNumbersLexicographically(actualCoordinates);
    const expectedCoordinates = [
      [0, 0, 0, 0],
      [1, 0, 0, 0],
      [1, 1, 0, 0],
      [1, 0, 1, 0],
      [1, 1, 1, 0],
      [1, 0, 0, 1],
      [1, 1, 0, 1],
      [1, 0, 1, 1],
      [1, 1, 1, 1],
      [2, 0, 0, 0],
      [2, 1, 0, 0],
      [2, 0, 1, 0],
      [2, 1, 1, 0],
      [2, 0, 0, 1],
      [2, 1, 0, 1],
      [2, 0, 1, 1],
      [2, 1, 1, 1],
      [2, 2, 0, 0],
      [2, 3, 0, 0],
      [2, 2, 1, 0],
      [2, 3, 1, 0],
      [2, 2, 0, 1],
      [2, 3, 0, 1],
      [2, 2, 1, 1],
      [2, 3, 1, 1],
      [2, 0, 2, 0],
      [2, 1, 2, 0],
      [2, 0, 3, 0],
      [2, 1, 3, 0],
      [2, 0, 2, 1],
      [2, 1, 2, 1],
      [2, 0, 3, 1],
      [2, 1, 3, 1],
      [2, 2, 2, 0],
      [2, 3, 2, 0],
      [2, 2, 3, 0],
      [2, 3, 3, 0],
      [2, 2, 2, 1],
      [2, 3, 2, 1],
      [2, 2, 3, 1],
      [2, 3, 3, 1],
      [2, 0, 0, 2],
      [2, 1, 0, 2],
      [2, 0, 1, 2],
      [2, 1, 1, 2],
      [2, 0, 0, 3],
      [2, 1, 0, 3],
      [2, 0, 1, 3],
      [2, 1, 1, 3],
      [2, 2, 0, 2],
      [2, 3, 0, 2],
      [2, 2, 1, 2],
      [2, 3, 1, 2],
      [2, 2, 0, 3],
      [2, 3, 0, 3],
      [2, 2, 1, 3],
      [2, 3, 1, 3],
      [2, 0, 2, 2],
      [2, 1, 2, 2],
      [2, 0, 3, 2],
      [2, 1, 3, 2],
      [2, 0, 2, 3],
      [2, 1, 2, 3],
      [2, 0, 3, 3],
      [2, 1, 3, 3],
      [2, 2, 2, 2],
      [2, 3, 2, 2],
      [2, 2, 3, 2],
      [2, 3, 3, 2],
      [2, 2, 2, 3],
      [2, 3, 2, 3],
      [2, 2, 3, 3],
      [2, 3, 3, 3],
    ];
    SpecHelpers.sortNumbersLexicographically(expectedCoordinates);
    expect(actualCoordinates).toEqual(expectedCoordinates);
  });

  it("throws an error for non-positive subtree levels in createSubtreeCoordinatesIterator", function () {
    const implicitTiling = createQuadtreeImplicitTiling(0);
    expect(function () {
      ImplicitTilings.createSubtreeCoordinatesIterator(implicitTiling);
    }).toThrowError();
  });

  it("computes the right number of nodes for QUADTREE with computeNumberOfNodesPerSubtree", function () {
    const implicitTiling1 = createQuadtreeImplicitTiling(1);
    const implicitTiling2 = createQuadtreeImplicitTiling(2);
    const implicitTiling4 = createQuadtreeImplicitTiling(4);
    const implicitTiling8 = createQuadtreeImplicitTiling(8);

    const actualNumberOfNodes1 =
      ImplicitTilings.computeNumberOfNodesPerSubtree(implicitTiling1);
    const actualNumberOfNodes2 =
      ImplicitTilings.computeNumberOfNodesPerSubtree(implicitTiling2);
    const actualNumberOfNodes4 =
      ImplicitTilings.computeNumberOfNodesPerSubtree(implicitTiling4);
    const actualNumberOfNodes8 =
      ImplicitTilings.computeNumberOfNodesPerSubtree(implicitTiling8);

    const expectedNumberOfNodes1 = 1;
    const expectedNumberOfNodes2 = 5;
    const expectedNumberOfNodes4 = 85;
    const expectedNumberOfNodes8 = 21845;

    expect(actualNumberOfNodes1).toEqual(expectedNumberOfNodes1);
    expect(actualNumberOfNodes2).toEqual(expectedNumberOfNodes2);
    expect(actualNumberOfNodes4).toEqual(expectedNumberOfNodes4);
    expect(actualNumberOfNodes8).toEqual(expectedNumberOfNodes8);
  });
  it("computes the right number of nodes for OCTREE with computeNumberOfNodesPerSubtree", function () {
    const implicitTiling1 = createOctreeImplicitTiling(1);
    const implicitTiling2 = createOctreeImplicitTiling(2);
    const implicitTiling4 = createOctreeImplicitTiling(4);
    const implicitTiling8 = createOctreeImplicitTiling(8);

    const actualNumberOfNodes1 =
      ImplicitTilings.computeNumberOfNodesPerSubtree(implicitTiling1);
    const actualNumberOfNodes2 =
      ImplicitTilings.computeNumberOfNodesPerSubtree(implicitTiling2);
    const actualNumberOfNodes4 =
      ImplicitTilings.computeNumberOfNodesPerSubtree(implicitTiling4);
    const actualNumberOfNodes8 =
      ImplicitTilings.computeNumberOfNodesPerSubtree(implicitTiling8);

    const expectedNumberOfNodes1 = 1;
    const expectedNumberOfNodes2 = 9;
    const expectedNumberOfNodes4 = 585;
    const expectedNumberOfNodes8 = 2396745;

    expect(actualNumberOfNodes1).toEqual(expectedNumberOfNodes1);
    expect(actualNumberOfNodes2).toEqual(expectedNumberOfNodes2);
    expect(actualNumberOfNodes4).toEqual(expectedNumberOfNodes4);
    expect(actualNumberOfNodes8).toEqual(expectedNumberOfNodes8);
  });

  it("throws an error for non-positive subtree levels in computeNumberOfNodesPerSubtree", function () {
    const implicitTiling = createQuadtreeImplicitTiling(0);
    expect(function () {
      ImplicitTilings.computeNumberOfNodesPerSubtree(implicitTiling);
    }).toThrowError();
  });

  it("computes the right number of nodes for QUADTREE with computeNumberOfNodesInLevel", function () {
    const implicitTiling = createQuadtreeImplicitTiling(8);

    const actualNumberOfNodes0 = ImplicitTilings.computeNumberOfNodesInLevel(
      implicitTiling,
      0
    );
    const actualNumberOfNodes1 = ImplicitTilings.computeNumberOfNodesInLevel(
      implicitTiling,
      1
    );
    const actualNumberOfNodes2 = ImplicitTilings.computeNumberOfNodesInLevel(
      implicitTiling,
      2
    );
    const actualNumberOfNodes4 = ImplicitTilings.computeNumberOfNodesInLevel(
      implicitTiling,
      4
    );

    const expectedNumberOfNodes0 = 1;
    const expectedNumberOfNodes1 = 4;
    const expectedNumberOfNodes2 = 16;
    const expectedNumberOfNodes4 = 256;

    expect(actualNumberOfNodes0).toEqual(expectedNumberOfNodes0);
    expect(actualNumberOfNodes1).toEqual(expectedNumberOfNodes1);
    expect(actualNumberOfNodes2).toEqual(expectedNumberOfNodes2);
    expect(actualNumberOfNodes4).toEqual(expectedNumberOfNodes4);
  });
  it("computes the right number of nodes for OCTREE with computeNumberOfNodesInLevel", function () {
    const implicitTiling = createOctreeImplicitTiling(8);

    const actualNumberOfNodes0 = ImplicitTilings.computeNumberOfNodesInLevel(
      implicitTiling,
      0
    );
    const actualNumberOfNodes1 = ImplicitTilings.computeNumberOfNodesInLevel(
      implicitTiling,
      1
    );
    const actualNumberOfNodes2 = ImplicitTilings.computeNumberOfNodesInLevel(
      implicitTiling,
      2
    );
    const actualNumberOfNodes4 = ImplicitTilings.computeNumberOfNodesInLevel(
      implicitTiling,
      4
    );

    const expectedNumberOfNodes0 = 1;
    const expectedNumberOfNodes1 = 8;
    const expectedNumberOfNodes2 = 64;
    const expectedNumberOfNodes4 = 4096;

    expect(actualNumberOfNodes0).toEqual(expectedNumberOfNodes0);
    expect(actualNumberOfNodes1).toEqual(expectedNumberOfNodes1);
    expect(actualNumberOfNodes2).toEqual(expectedNumberOfNodes2);
    expect(actualNumberOfNodes4).toEqual(expectedNumberOfNodes4);
  });

  it("throws an error for negative level in computeNumberOfNodesInLevel", function () {
    const implicitTiling = createQuadtreeImplicitTiling(3);
    expect(function () {
      ImplicitTilings.computeNumberOfNodesInLevel(implicitTiling, -1);
    }).toThrowError();
  });

  it("computes the right coordinates for QUADTREE in globalizeCoordinates", function () {
    const implicitTiling = createQuadtreeImplicitTiling(3);
    const actualCoordinates = ImplicitTilings.globalizeCoordinates(
      implicitTiling,
      new QuadtreeCoordinates(2, 1, 0),
      new QuadtreeCoordinates(1, 2, 1)
    );

    const expectedCoordinates = new QuadtreeCoordinates(3, 4, 1);
    expect(actualCoordinates.toArray()).toEqual(expectedCoordinates.toArray());
  });

  it("computes the right coordinates for QUADTREE in globalizeCoordinates", function () {
    const implicitTiling = createOctreeImplicitTiling(3);
    const actualCoordinates = ImplicitTilings.globalizeCoordinates(
      implicitTiling,
      new OctreeCoordinates(2, 1, 0, 1),
      new OctreeCoordinates(1, 2, 1, 2)
    );

    const expectedCoordinates = new OctreeCoordinates(3, 4, 1, 4);
    expect(actualCoordinates.toArray()).toEqual(expectedCoordinates.toArray());
  });
});
