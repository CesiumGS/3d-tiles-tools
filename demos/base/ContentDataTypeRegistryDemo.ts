import { BufferedContentData } from "3d-tiles-tools";
import { ContentDataTypeRegistry } from "3d-tiles-tools";

const SPECS_DATA_BASE_DIRECTORY = "./specs/data";

async function testContentDataTypeRegistry() {
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
    const contentDataType = await ContentDataTypeRegistry.findContentDataType(
      contentData
    );
    console.log(
      "Content data type is " + contentDataType + " for " + contentUri
    );
  }
}

testContentDataTypeRegistry();
