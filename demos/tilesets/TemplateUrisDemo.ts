import { QuadtreeCoordinates } from "3d-tiles-tools";
import { OctreeCoordinates } from "3d-tiles-tools";

import { TemplateUris } from "3d-tiles-tools";

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

function runDemos() {
  testSubstituteQuadtree();
  testSubstituteOctree();
}

runDemos();
