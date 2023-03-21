import path from "path";

import { readJsonUnchecked } from "./readJsonUnchecked";

import { ResourceResolvers } from "../src/io/ResourceResolvers";

import { QuadtreeCoordinates } from "../src/implicitTiling/QuadtreeCoordinates";
import { SubtreeInfos } from "../src/implicitTiling/SubtreeInfos";

async function testSubtreeInfo() {
  // Create a `SubtreeInfo` for a valid subtree, from
  // the specs data directory
  const subtreeFilePath = "./specs/data/subtrees/validSubtree.json";
  const implcitTilingFilePath =
    "specs/data/subtrees/validSubtreeImplicitTiling.json.input";
  const implicitTiling = await readJsonUnchecked(implcitTilingFilePath);
  const subtree = await readJsonUnchecked(subtreeFilePath);
  const directory = path.dirname(subtreeFilePath);
  const resourceResolver =
    ResourceResolvers.createFileResourceResolver(directory);
  const subtreeInfo = await SubtreeInfos.createFromJson(
    subtree,
    implicitTiling,
    resourceResolver
  );
  if (!subtreeInfo) {
    console.log("Could not resolve subtree data");
    return;
  }

  // Print the tile availability information, accessing it by index
  console.log("Tile availability from indices:");
  const tileAvailabilityInfo = subtreeInfo.tileAvailabilityInfo;
  for (let i = 0; i < tileAvailabilityInfo.length; i++) {
    const available = tileAvailabilityInfo.isAvailable(i);
    console.log("  at index " + i + " available :" + available);
  }

  // Print the tile availability information, accessing it with
  // the index that is computed from QuadtreeCoordinates
  console.log("Tile availability from coordinates:");
  const r = new QuadtreeCoordinates(0, 0, 0);
  const depthFirst = false;
  const maxLevelInclusive = implicitTiling.subtreeLevels - 1;
  for (const c of r.descendants(maxLevelInclusive, depthFirst)) {
    const index = c.toIndex();
    const available = tileAvailabilityInfo.isAvailable(index);
    console.log(
      "  " + c + " index " + c.toIndex() + " available: " + available
    );
  }
}

async function runDemos() {
  await testSubtreeInfo();
}

runDemos();
