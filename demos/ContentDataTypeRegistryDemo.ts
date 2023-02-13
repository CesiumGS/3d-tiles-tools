import { ResourceResolvers } from "../src/io/ResourceResolvers";
import { ContentData } from "../src/contentTypes/ContentData";
import { ContentDataTypeRegistry } from "../src/contentTypes/ContentDataTypeRegistry";

// Creates a 'ContentData' from the given URI (resolving
// it against `.` in the local file system), determines
// the content data type, and prints it
async function testContentDataType(contentUri: string) {
  const resourceResolver = ResourceResolvers.createFileResourceResolver(".");
  const contentData = new ContentData(contentUri, resourceResolver);
  const contentDataType = await ContentDataTypeRegistry.findContentDataType(
    contentData
  );
  console.log("Content data type is " + contentDataType + " for " + contentUri);
}

async function testContentDataTypeRegistry() {
  await testContentDataType(
    "./specs/data/CesiumTexturedBox/CesiumTexturedBox.glb"
  );
  await testContentDataType("./specs/data/instancedWithBatchTableBinary.i3dm");
  await testContentDataType("./specs/data/batchedWithBatchTableBinary.b3dm");
  await testContentDataType("./specs/data/Tileset/tileset.json");
  await testContentDataType("./specs/data/composite.cmpt");
  await testContentDataType("./specs/data/Triangle/Triangle.gltf");
  await testContentDataType("./specs/data/tileset.3dtiles");
  await testContentDataType("./specs/data/THIS_DOES_NOT_EXIST.XYZ");
}

testContentDataTypeRegistry();
