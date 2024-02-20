import { BufferedContentData } from "3d-tiles-tools";
import { ContentDataTypeChecks } from "3d-tiles-tools";
import { ContentDataTypes } from "3d-tiles-tools";

const SPECS_DATA_BASE_DIRECTORY = "./specs/data";

async function testContentDataTypeChecks() {
  const check = ContentDataTypeChecks.createIncludedCheck(
    ContentDataTypes.CONTENT_TYPE_TILESET,
    ContentDataTypes.CONTENT_TYPE_GLB
  );

  const contentUris = [
    "/contentTypes/content.3tz",
    "/contentTypes/content.b3dm",
    "/contentTypes/content.cmpt",
    "/contentTypes/content.geojson",
    "/contentTypes/content.geom",
    "/contentTypes/content.glb",
    "/contentTypes/content.gltf",
    "/contentTypes/content.i3dm",
    "/contentTypes/content.json",
    "/contentTypes/content.pnts",
    "/contentTypes/content.txt",
    "/contentTypes/content.vctr",
  ].map((u: string) => SPECS_DATA_BASE_DIRECTORY + u);

  for (const contentUri of contentUris) {
    const contentData = BufferedContentData.create(contentUri);
    const result = await check(contentData);
    console.log("Result is " + result + " for " + contentUri);
  }
}

testContentDataTypeChecks();
