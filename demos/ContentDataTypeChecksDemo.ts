import { BufferedContentData } from "../src/contentTypes/BufferedContentData";
import { ContentDataTypeChecks } from "../src/contentTypes/ContentDataTypeChecks";
import { ContentDataTypes } from "../src/contentTypes/ContentDataTypes";

async function testContentDataTypeChecks() {
  const check = ContentDataTypeChecks.createIncludedCheck(
    ContentDataTypes.CONTENT_TYPE_TILESET,
    ContentDataTypes.CONTENT_TYPE_GLB
  );

  const contentUris = [
    "./specs/data/contentTypes/content.3tz",
    "./specs/data/contentTypes/content.b3dm",
    "./specs/data/contentTypes/content.cmpt",
    "./specs/data/contentTypes/content.geojson",
    "./specs/data/contentTypes/content.geom",
    "./specs/data/contentTypes/content.glb",
    "./specs/data/contentTypes/content.gltf",
    "./specs/data/contentTypes/content.i3dm",
    "./specs/data/contentTypes/content.json",
    "./specs/data/contentTypes/content.pnts",
    "./specs/data/contentTypes/content.txt",
    "./specs/data/contentTypes/content.vctr",
  ];

  for (const contentUri of contentUris) {
    const contentData = BufferedContentData.create(contentUri);
    const result = await check(contentData);
    console.log("Result is " + result + " for " + contentUri);
  }
}

testContentDataTypeChecks();
