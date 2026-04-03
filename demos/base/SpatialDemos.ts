import { Quadtrees } from "3d-tiles-tools";
import { QuadtreeCoordinates } from "3d-tiles-tools";

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

function runDemos() {
  testQuadtreeChildren();
  testQuadtreeDescendants();
  testQuadtreeLevel();
}

runDemos();
