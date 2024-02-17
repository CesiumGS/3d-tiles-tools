import { Tile } from "../../../src/structure";

import { Tiles } from "../../../src/tilesets";

//============================================================================
// Test data definition

// A unit bounding box to be used for all tiles
const unitBoundingBox = {
  box: [0.5, 0.5, 0.5, 0.5, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.5],
};

// A tile with a single content URI
const tileWithContentUri = {
  content: {
    uri: "tileWithContentUri.content.uri",
  },
  boundingVolume: unitBoundingBox,
  geometricError: 16.0,
};

// Tile with single content URL ("L" is for "Legacy")
const legacyTileWithContentUri: unknown = {
  content: {
    url: "tileWithContentUrl.content.url",
  },
  boundingVolume: unitBoundingBox,
  geometricError: 16.0,
};
const tileWithContentUrl = legacyTileWithContentUri as Tile;

// Tile with multiple contents
const tileWithMultipleContents = {
  contents: [
    {
      uri: "tileWithMultipleContents.contents[0].uri",
    },
    {
      uri: "tileWithMultipleContents.contents[1].uri",
    },
  ],
  boundingVolume: unitBoundingBox,
  geometricError: 16.0,
};

// Tile without content (but with further children)
const tileWithoutContent = {
  boundingVolume: unitBoundingBox,
  geometricError: 16.0,
  children: [
    {
      content: {
        uri: "tileWithoutContent.children[0].content.uri",
      },
      boundingVolume: unitBoundingBox,
      geometricError: 8.0,
    },
    {
      content: {
        uri: "tileWithoutContent.children[1].content.uri",
      },
      boundingVolume: unitBoundingBox,
      geometricError: 8.0,
    },
  ],
};

// The root
const root = {
  content: {
    uri: "root.content.uri",
  },
  boundingVolume: unitBoundingBox,
  geometricError: 32.0,
  children: [
    tileWithContentUri,
    tileWithContentUrl,
    tileWithMultipleContents,
    tileWithoutContent,
  ],
};

//============================================================================

describe("Tiles", function () {
  it("getContentUris returns URI of a single content", function () {
    const contentUris = Tiles.getContentUris(tileWithContentUri);
    expect(contentUris).toEqual(["tileWithContentUri.content.uri"]);
  });

  it("getContentUris returns (legacy) URL as URI of a single content", function () {
    const contentUris = Tiles.getContentUris(tileWithContentUrl);
    expect(contentUris).toEqual(["tileWithContentUrl.content.url"]);
  });

  it("getContentUris returns URIs of multiple contents", function () {
    const contentUris = Tiles.getContentUris(tileWithMultipleContents);
    expect(contentUris).toEqual([
      "tileWithMultipleContents.contents[0].uri",
      "tileWithMultipleContents.contents[1].uri",
    ]);
  });

  it("getContentUris returns empty array for tiles without content", function () {
    const contentUris = Tiles.getContentUris(tileWithoutContent);
    expect(contentUris).toEqual([]);
  });

  it("traverseExplicit visits all tiles", async function () {
    // Traverse the tiles and collect the content URIs
    const visitedContentUris: string[] = [];
    await Tiles.traverseExplicit(root, async (tileStack: Tile[]) => {
      const visitedTile = tileStack[tileStack.length - 1];
      const contentUris = Tiles.getContentUris(visitedTile);
      visitedContentUris.push(...contentUris);
      return true;
    });

    const expected = [
      "root.content.uri",
      "tileWithContentUri.content.uri",
      "tileWithContentUrl.content.url",
      "tileWithMultipleContents.contents[0].uri",
      "tileWithMultipleContents.contents[1].uri",
      "tileWithoutContent.children[0].content.uri",
      "tileWithoutContent.children[1].content.uri",
    ];
    expect(visitedContentUris).toEqual(expected);
  });

  it("traverseExplicit stops traversal when callback returns 'false'", async function () {
    // Traverse the tiles and collect the content URIs
    const visitedContentUris: string[] = [];
    await Tiles.traverseExplicit(root, async (tileStack: Tile[]) => {
      const visitedTile = tileStack[tileStack.length - 1];
      const contentUris = Tiles.getContentUris(visitedTile);
      visitedContentUris.push(...contentUris);

      const currentDepth = tileStack.length;
      const continueTraversal = currentDepth < 2;
      return continueTraversal;
    });

    const expected = [
      "root.content.uri",
      "tileWithContentUri.content.uri",
      "tileWithContentUrl.content.url",
      "tileWithMultipleContents.contents[0].uri",
      "tileWithMultipleContents.contents[1].uri",
    ];
    expect(visitedContentUris).toEqual(expected);
  });
});
