import { Quadtrees } from "../src/implicitTiling/Quadtrees";
import { TemplateUris } from "../src/implicitTiling/TemplateUris";
import { QuadtreeCoordinates } from "../src/implicitTiling/QuadtreeCoordinates";
import { OctreeCoordinates } from "../src/implicitTiling/OctreeCoordinates";

/**
 * A basic demo of the `QuadtreeCoordinates.children` method
 */
function testQuadtreeChildren() {
  const r = new QuadtreeCoordinates(0, 0, 0);
  console.log("Children of " + r + ":");
  for (const c of r.children()) {
    console.log("  " + c + " index " + c.toIndex() + " parent " + c.parent());
  }
}

/**
 * A basic demo of the `QuadtreeCoordinates.descendants` method
 */
function testQuadtreeDescendants() {
  const r = new QuadtreeCoordinates(0, 0, 0);
  const maxLevelInclusive = 3;
  const depthFirst = true;
  console.log("Descendants of " + r + " up to " + maxLevelInclusive + ":");
  for (const c of r.descendants(maxLevelInclusive, depthFirst)) {
    console.log("  " + c + " index " + c.toIndex() + " parent " + c.parent());
  }
}

/**
 * A basic demo of the `Quadtrees.coordinatesForLevel` method
 */
function testQuadtreeLevel() {
  const level = 3;
  const coords = Quadtrees.coordinatesForLevel(3);
  console.log("Coordinates in level " + level + ":");
  for (const c of coords) {
    console.log("  " + c);
  }
}

/**
 * A basic demo for the `TemplateUris.substituteQuadtree` method
 */
function testSubstituteQuadtree() {
  const uri = "test-{level}-{x}-{y}";
  const c = new QuadtreeCoordinates(3, 4, 5);
  const s = TemplateUris.substituteQuadtree(uri, c);
  console.log("uri        : " + uri);
  console.log("coordinates: " + c);
  console.log("result     : " + s);
}

/**
 * A basic demo for the `TemplateUris.substituteOctree` method
 */
function testSubstituteOctree() {
  const uri = "test-{level}-{x}-{y}-{z}";
  const c = new OctreeCoordinates(3, 4, 5, 6);
  const s = TemplateUris.substituteOctree(uri, c);
  console.log("uri        : " + uri);
  console.log("coordinates: " + c);
  console.log("result     : " + s);
}

async function runDemos() {
  testQuadtreeChildren();
  testQuadtreeDescendants();
  testQuadtreeLevel();
  testSubstituteQuadtree();
  testSubstituteOctree();
}

runDemos();
